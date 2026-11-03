import { describe, it, expect } from "vitest";
import {
  freshTerminal,
  runCommand,
  terminalLabs,
  terminalCheck,
  normalizeTerminal,
  tokenize,
} from "./terminal";
const last = (s: ReturnType<typeof freshTerminal>) => s.history.at(-1)!;
describe("Linux practice host", () => {
  for (const lab of terminalLabs)
    it(`solves ${lab.id} only after diagnosis and recovery checks`, () => {
      let s = freshTerminal(lab.id);
      expect(terminalCheck(s).passed).toBe(false);
      for (const c of lab.solution) s = runCommand(s, c);
      expect(terminalCheck(s)).toEqual({
        checks: [true, true, true],
        passed: true,
        score: 100,
      });
      expect(s.lastExitCode).toBe(0);
    });
  it("supports paths, relative directories, quoted content, writes, and permission output", () => {
    let s = freshTerminal();
    s = runCommand(s, "cd /etc; pwd; ls -l ssh");
    expect(last(s).output).toContain("/etc");
    expect(last(s).output).toContain("sshd_config");
    s = runCommand(
      s,
      "cd ~/; mkdir -p notes/today; echo 'checked the gateway' > notes/today/check.txt; cat notes/today/check.txt",
    );
    expect(last(s).output).toContain("checked the gateway");
    s = runCommand(s, "chmod 600 notes/today/check.txt; ls -l notes/today");
    expect(last(s).output).toContain("-rw-------");
    s = runCommand(s, "cd ../..; pwd");
    expect(last(s).output).toBe("/");
  });
  it("pipes and filters actual command output and preserves line counts", () => {
    let s = freshTerminal("service");
    s = runCommand(s, "journalctl -u sshd | grep -i error | wc -l");
    expect(last(s).output).toBe("1");
    s = runCommand(s, "cat /var/log/training.log | grep -v ERROR | wc -l");
    expect(last(s).output).toBe("3");
    s = runCommand(
      s,
      "echo hello > /home/learner/sample.txt; cat /home/learner/sample.txt | wc -l",
    );
    expect(last(s).output).toBe("1");
  });
  it("does not return another service’s journal", () => {
    let s = runCommand(freshTerminal("service"), "journalctl -u sshd");
    expect(last(s).output).toContain("Badly formatted port");
    expect(last(s).output).not.toContain("NetworkManager");
    s = runCommand(s, "journalctl -u missing");
    expect(last(s).output).toBe("-- No entries --");
  });
  it("honors ping count and interface arguments, and errors on missing devices", () => {
    let s = runCommand(freshTerminal(), "ip link show eno1");
    expect(last(s).output).toContain("state DOWN");
    s = runCommand(s, "sudo ip link set dev eno1 up");
    s = runCommand(s, "ping -c 4 10.120.0.1");
    expect(last(s).output).toContain("4 packets transmitted, 4 received");
    s = runCommand(s, "ip link show missing");
    expect(s.lastExitCode).not.toBe(0);
  });
  it("requires a repaired host resolver rather than an explicit one-off DNS query", () => {
    let s = freshTerminal("dns");
    s = runCommand(s, "dig @10.120.0.53 training.example");
    expect(last(s).output).toContain("NOERROR");
    expect(terminalCheck(s).passed).toBe(false);
    s = runCommand(s, "dig training.example");
    expect(s.lastExitCode).toBe(1);
    s = runCommand(s, "ping -c 4 10.120.0.80");
    expect(s.lastExitCode).toBe(0);
  });
  it("keeps active logs, blocks arbitrary system writes, and never executes host syntax", () => {
    let s = freshTerminal("disk");
    for (const cmd of [
      "sudo rm /var/log/messages",
      "rm -rf /",
      "echo unsafe > /etc/hostname",
      "echo $(uname)",
    ]) {
      s = runCommand(s, cmd);
      expect(s.lastExitCode).not.toBe(0);
    }
    expect(s.files!["/var/log/messages"]).toBeDefined();
    expect(s.files!["/etc/hostname"].content).toBe("dco-lab\n");
  });
  it("keeps the host state and command recall when output is cleared", () => {
    let s = freshTerminal();
    s = runCommand(s, "sudo ip link set eno1 up");
    s = runCommand(s, "clear");
    expect(s.history).toEqual([]);
    expect(s.up).toBe(true);
    expect(s.commandHistory).toContain("sudo ip link set eno1 up");
  });
  it("upgrades earlier saved terminal records and survives JSON round trips", () => {
    const old = {
      up: true,
      cwd: "/var/log",
      history: [{ command: "ip route", output: "default via 10.120.0.1" }],
    };
    const s = normalizeTerminal(old);
    expect(s.up).toBe(true);
    expect(s.labId).toBe("network");
    expect(s.files!["/etc/resolv.conf"]).toBeDefined();
    expect(normalizeTerminal(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it("treats quotes as arguments and reports incomplete syntax", () => {
    expect(tokenize("grep -i 'error message' /var/log/messages")).toEqual([
      "grep",
      "-i",
      "error message",
      "/var/log/messages",
    ]);
    expect(() => tokenize('echo "unfinished')).toThrow("Unclosed quote");
  });
});

it("keeps diagnostics out of a pipe and reports the last pipeline status", () => {
  const s = runCommand(freshTerminal(), "cat /missing-file | wc -l");
  expect(s.history.at(-1)?.output).toContain("No such file");
  expect(s.history.at(-1)?.output.split("\n").at(-1)).toBe("0");
  expect(s.lastExitCode).toBe(0);
});
it("honors du depth and find type rather than returning unrelated snapshots", () => {
  let s = runCommand(freshTerminal("disk"), "du -h --max-depth=1 /var/log");
  expect(s.history.at(-1)?.output).toContain("16G\t/var/log/archive");
  s = runCommand(s, "find /var/log -type d");
  expect(s.history.at(-1)?.output).toContain("/var/log/archive");
  expect(s.history.at(-1)?.output).not.toContain("old-debug.log");
  s = runCommand(s, "uname -r");
  expect(s.history.at(-1)?.output).toBe("6.8.0");
});

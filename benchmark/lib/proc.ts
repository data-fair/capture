import fs from 'node:fs'

// CPU and memory of a browser: the launched process and all its descendants (zygotes, renderers,
// gpu, network service...), read from /proc. Linux only.

const CLK_TCK = 100

const readStat = (pid: number) => {
  try {
    const raw = fs.readFileSync(`/proc/${pid}/stat`, 'utf8')
    // the command name is between parentheses and may contain spaces
    const fields = raw.slice(raw.lastIndexOf(')') + 2).split(' ')
    return {
      ppid: Number(fields[1]),
      // utime + stime + cutime + cstime: the children reaped by a process (renderers closed with
      // their page) are accounted in the cumulated fields of their parent
      ticks: Number(fields[11]) + Number(fields[12]) + Number(fields[13]) + Number(fields[14])
    }
  } catch {
    return null
  }
}

export const processTree = (rootPid: number) => {
  const parents = new Map<number, number>()
  for (const entry of fs.readdirSync('/proc')) {
    const pid = Number(entry)
    if (!pid) continue
    const stat = readStat(pid)
    if (stat) parents.set(pid, stat.ppid)
  }
  const tree = new Set([rootPid])
  let grown = true
  while (grown) {
    grown = false
    for (const [pid, ppid] of parents) {
      if (!tree.has(pid) && tree.has(ppid)) {
        tree.add(pid)
        grown = true
      }
    }
  }
  return [...tree]
}

// cumulated CPU milliseconds of the tree
export const treeCpuMs = (rootPid: number) => {
  let ticks = 0
  for (const pid of processTree(rootPid)) ticks += readStat(pid)?.ticks ?? 0
  return ticks * 1000 / CLK_TCK
}

// proportional set size of the tree in MB: shared pages are split between the processes that map
// them, so the sum is not inflated like a sum of RSS
export const treePssMB = (rootPid: number) => {
  let kb = 0
  for (const pid of processTree(rootPid)) {
    try {
      const m = fs.readFileSync(`/proc/${pid}/smaps_rollup`, 'utf8').match(/^Pss:\s+(\d+) kB/m)
      if (m) kb += Number(m[1])
    } catch {}
  }
  return Math.round(kb / 1024)
}

export const treeSize = (rootPid: number) => processTree(rootPid).length

// CPU of the current node process
export const selfCpuMs = () => {
  const u = process.cpuUsage()
  return (u.user + u.system) / 1000
}

/**
 * ? Cluster use round-robin algorithm for forwarding
 * ? request to one of child processes.
 *
 * ? Primary(master) process works as balancer
 */

/**
 * ? Indeed >> kill command equals generate event `SIGKILL` (code = 9)
 */

import cluster from 'cluster'
import os from 'os'

const pid = process.pid

if (cluster.isPrimary) {
  // const cpusCount = os.cpus().length
  const cpusCount = 3
  console.log(`CPUs: ${cpusCount}`)
  console.log(`Master started. Pid: ${pid}`)

  for (let i = 0; i < cpusCount - 1; i++) {
    const worker = cluster.fork()

    worker.on('listening', () => {
      // 3
      worker.send(`(hello from master process)`)
    })

    // ? If we kill this process - it will be revived

    // It should not work, because we for process, but don't set handlers
    // worker.on('exit', () => {
    //   console.log(`Worker died. Pid : ${worker.process.pid}`)
    //   /**
    //    * ? Restore this process
    //    */
    //   cluster.fork()
    // })

    // 2
    worker.on('message', (msg) => {
      console.log(
        // eslint-disable-next-line prettier/prettier
        `[Master]: Receive message from child, child pid = ${worker.process.pid}: ${JSON.stringify(
          msg
        )} \n`
      )
    })
  }

  cluster.on('exit', (worker, code) => {
    console.log(`Worker died. Pid : ${worker.process.pid}`)
    console.log(`code : ${code}`)

    /**
     * ? Kill command generate 0 code
     */
    if (code === 1) {
      /**
       * ? Restore this process
       */
      cluster.fork()
    }
  })
}

if (cluster.isWorker) {
  await import('./worker.js')

  // 4
  process.on('message', (msg) => {
    console.log(`[Child = ${process.pid}]: Receive message from master: ${msg} \n`)
  })

  // 1
  process.send({ text: '(hello from child process)', pid })
}

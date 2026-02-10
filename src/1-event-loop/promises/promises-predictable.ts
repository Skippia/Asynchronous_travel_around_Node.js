/**
 * ? Unlike of Promise.resolve() (check ./promises-unpredictable.ts),
 * ? "usual promises" (timeouts, networks) work as expected
 * ? and their behavior is predictable.
 *
 * ? It doesn't matter if we use sleep or makeFetch function
 * ? the result is the same.
 *
 * * ✅✅✅ means that i understand how it works
 */

async function sleep(ms = 1000) {
  return await new Promise((resolve) => setTimeout(resolve, 1000))
}

async function makeFetch() {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
  const data = await response.json()
  return data
}

async function fetchOrSleep() {
  return makeFetch()
  // return sleep()
}

// ✅✅✅
async function promiseFetchOrSleep1() {
  /**
   * Output:
   * 1
   * data: undefined
   * 2
   * 3
   * 4
   * 5
   * 6
   */
  fetchOrSleep()
    .then(() => {
      console.log(1)

      fetchOrSleep().then(() => {
        console.log(2)
        fetchOrSleep().then(() => {
          console.log(3)
          fetchOrSleep().then(() => {
            console.log(4)
            fetchOrSleep().then(() => {
              console.log(5)
              fetchOrSleep().then(() => {
                console.log(6)
              })
            })
          })
        })
      })
    })
    .then((data) => console.log('data:', data))
}

// ✅✅✅
async function promiseFetchOrSleep2() {
  /**
   * Return after console.log(1)
   */
  /**
   * Output:
   * 1
   * 2
   * data: undefined
   * 3
   * 4
   * 5
   * 6
   */
  fetchOrSleep()
    .then(() => {
      console.log(1)

      return fetchOrSleep().then(() => {
        console.log(2)
        fetchOrSleep().then(() => {
          console.log(3)
          fetchOrSleep().then(() => {
            console.log(4)
            fetchOrSleep().then(() => {
              console.log(5)
              fetchOrSleep().then(() => {
                console.log(6)
              })
            })
          })
        })
      })
    })
    .then((data) => console.log('data:', data))
}

// ✅✅✅
async function promiseFetchOrSleep3() {
  /**
   * The same as promise2 but with async
   */
  /**
   * Output:
   * 1
   * 2
   * data: undefined
   * 3
   * 4
   * 5
   * 6
   */
  fetchOrSleep()
    .then(() => {
      console.log(1)

      return fetchOrSleep().then(async () => {
        console.log(2)
        fetchOrSleep().then(() => {
          console.log(3)
          fetchOrSleep().then(() => {
            console.log(4)
            fetchOrSleep().then(() => {
              console.log(5)
              fetchOrSleep().then(() => {
                console.log(6)
              })
            })
          })
        })
      })
    })
    .then((data) => console.log('data:', data))
}

// ✅✅✅
async function promiseFetchOrSleep4() {
  /**
   * Return after console.log(2)
   */
  /**
   * Output:
   * 1
   * data: undefined
   * 2
   * 3
   * 4
   * 5
   * 6
   */
  fetchOrSleep()
    .then(() => {
      console.log(1)
      fetchOrSleep().then(() => {
        console.log(2)
        return fetchOrSleep().then(() => {
          console.log(3)
          fetchOrSleep().then(() => {
            console.log(4)
            fetchOrSleep().then(() => {
              console.log(5)
              fetchOrSleep().then(() => {
                console.log(6)
              })
            })
          })
        })
      })
    })
    .then((data) => console.log('data:', data))
}

// ✅✅✅
async function promiseFetchOrSleep5() {
  /**
   * Return after console.log(3)
   */
  /**
   * Output:
   * 1
   * data: undefined
   * 2
   * 3
   * 4
   * 5
   * 6
   */
  fetchOrSleep()
    .then(() => {
      console.log(1)
      fetchOrSleep().then(() => {
        console.log(2)
        fetchOrSleep().then(async () => {
          console.log(3)
          return fetchOrSleep().then(async () => {
            console.log(4)
            fetchOrSleep().then(async () => {
              console.log(5)
              fetchOrSleep().then(async () => {
                console.log(6)
              })
            })
          })
        })
      })
    })
    .then((data) => console.log('data:', data))
}

// ✅✅✅
async function promiseFetchOrSleep6() {
  /**
   * Output:
   * 1
   * 2
   * data: undefined
   * 3
   * 4
   * 5
   * 6
   */
  fetchOrSleep()
    .then(async () => {
      console.log(1)
      return fetchOrSleep().then(() => {
        console.log(2)
        fetchOrSleep().then(() => {
          console.log(3)
          fetchOrSleep().then(() => {
            console.log(4)
            fetchOrSleep().then(() => {
              console.log(5)
              fetchOrSleep().then(() => {
                console.log(6)
              })
            })
          })
        })
      })
    })
    .then((data) => console.log('data:', data))
}

export {
  promiseFetchOrSleep1,
  promiseFetchOrSleep2,
  promiseFetchOrSleep3,
  promiseFetchOrSleep4,
  promiseFetchOrSleep5,
  promiseFetchOrSleep6,
}

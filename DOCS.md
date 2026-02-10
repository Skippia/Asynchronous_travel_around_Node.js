# Asynchronous Node.js Playground

Учебный playground по асинхронности, многопоточности и параллельному программированию в Node.js. Десять тематических секций — от event loop до бенчмарков атомарных счётчиков.

## Оглавление

- [Требования и установка](#требования-и-установка)
- [Структура проекта](#структура-проекта)
- [1. Event Loop](#1-event-loop)
- [2. Async Debugger](#2-async-debugger)
- [3. Baseline Performance](#3-baseline-performance)
- [4. libuv Threadpool](#4-libuv-threadpool)
- [5. Worker Threads](#5-worker-threads)
- [6. Worker Pool](#6-worker-pool)
- [7. Multiprocessing и Clustering](#7-multiprocessing-и-clustering)
- [8. Примитивы синхронизации](#8-примитивы-синхронизации)
- [9. Модель акторов](#9-модель-акторов)
- [10. Atomic Benchmarks](#10-atomic-benchmarks)
- [Стек технологий](#стек-технологий)
- [Полезные ссылки](#полезные-ссылки)

---

## Требования и установка

- **Node.js** >= 18.12, < 19
- **pnpm** в качестве пакетного менеджера

```sh
git clone https://github.com/Lormida/Asynchronous_travel_around_Node.js.git \
&& cd Asynchronous_travel_around_Node.js \
&& pnpm i
```

### npm-скрипты

| Скрипт | Назначение |
|---|---|
| `npm run dev` | Запуск через `tsx --watch` (hot-reload) |
| `npm run start` | Однократный запуск через `tsx` |
| `npm run build` | Сборка TypeScript в `build/` |
| `npm run start:performance` | Сборка + запуск с `UV_THREADPOOL_SIZE=12` |
| `npm run dev:performance` | Hot-reload + `UV_THREADPOOL_SIZE=12` |
| `npm run start:debug` | Сборка + запуск с `--inspect-brk` |
| `npm run lint` | ESLint с автофиксом |
| `npm run test` | Jest с покрытием |

### Как запускать примеры

Точка входа — `src/main.ts`. Нужный пример раскомментируется в этом файле. Для функций — вызов напрямую, для модулей с воркерами/кластерами — динамический `import()`:

```typescript
// Вызов функции
microtasks_sync7()

// Импорт модуля (кластеры, mutex, semaphore)
import './8-sync-primitives-for-parallel-programming/mutex/2-deadlock'
```

`MeasurePerformance` — глобальная утилита для замеров времени. Регистрируется через `src/shared/global.ts` и доступна везде без импорта.

---

## Структура проекта

```
src/
├── main.ts                          # Точка входа, переключение примеров
├── shared/
│   ├── global.ts                    # Глобальная регистрация MeasurePerformance
│   ├── measurePerformance.ts        # Утилита замера времени (start/end)
│   └── index.ts
├── 1-event-loop/                    # Event loop: задачи, промисы, сравнение подходов
├── 2-async-debugger/                # Отладка async-операций через async_hooks
├── 3-baseline-performance/          # Стресс-тесты Express через autocannon
├── 4-libuv-threadpool/              # UV_THREADPOOL_SIZE и bcrypt
├── 5-worker-thread/                 # worker_threads API
├── 6-worker-pool/                   # Пулы воркеров (своя реализация + workerpool)
├── 7-processing-and-clustering/     # child_process.fork, cluster, PM2
├── 8-sync-primitives-for-.../       # Mutex, Semaphore, Atomics, SharedArrayBuffer
├── 9-actors-model/                  # Модель акторов (ссылки)
└── 10-atomic-benchmarks/            # Бенчмарки атомарных счётчиков (контенция vs шардирование)

loader.js                            # Custom ESM loader для резолва .js расширений
global.d.ts                          # Декларация глобального MeasurePerformance
```

### Утилиты

**`MeasurePerformance`** (`src/shared/measurePerformance.ts`) — статический класс с методами `start()` и `end()`. Возвращает длительность в секундах. Привязан к глобальному скоупу, поэтому доступен из любого файла без импорта:

```typescript
const id = MeasurePerformance.start()
// ... операция
const duration = MeasurePerformance.end(id) // "Duration: 16.50 s"
```

**`loader.js`** — custom ESM loader, нужен для корректного резолва `.js` расширений после компиляции TypeScript. Используется в `start:old` и `start:performance` скриптах.

---

## 1. Event Loop

### Задачи на порядок выполнения

**Файлы:** `src/1-event-loop/tasks-event-loop/`

Набор из ~20 функций, каждая демонстрирует конкретное поведение event loop. Есть две версии: `tasks-with-answers.ts` (с аннотациями порядка вывода) и `tasks-without-answers.ts` (без ответов, для самостоятельной работы).

#### Фазы event loop

Event loop в Node.js проходит фазы в определённом порядке: **timers** -> **pending callbacks** -> **idle/prepare** -> **poll** -> **check** -> **close callbacks**. Между каждой фазой выполняются микротаски (nextTick-очередь, затем Promise-очередь).

Важный нюанс — в ESM-модулях (а проект использует `"type": "module"`) порядок `process.nextTick` и `Promise.resolve` отличается от CJS. Код верхнего уровня ESM-модуля выполняется как микротаска, поэтому `nextTick` и `Promise.resolve` на верхнем уровне ведут себя иначе, чем внутри колбэков.

#### async/await и порядок выполнения

Примеры `sync_await1` и `sync_await2` демонстрируют, как `await` влияет на порядок. Async-функция без `await` внутри выполняется синхронно целиком. С `await` — всё после `await` откладывается как микротаска:

```typescript
async function sync_await2() {
  console.log(1)
  await Promise.resolve()  // всё после этой строки — микротаска
  console.log(2)
}
sync_await2()
console.log(3)
// Вывод: 1, 3, 2
```

#### Микротаски vs макротаски

Примеры из `tasks-with-answers.ts` покрывают взаимодействие между:

- `process.nextTick` — попадает в nextTick-очередь (приоритет выше, чем у Promise)
- `Promise.resolve().then()` — попадает в Promise-очередь (микротаска)
- `setTimeout` — фаза timers (макротаска)
- `setImmediate` — фаза check (макротаска)
- `queueMicrotask` — Promise-очередь

```typescript
// Пример: nextTick имеет приоритет над Promise
process.nextTick(() => console.log('nextTick'))       // 1
Promise.resolve().then(() => console.log('promise'))   // 2
```

#### Event loop starvation

Три варианта starvation (голодание event loop):

```typescript
// nextTick starvation — рекурсивный nextTick блокирует всё остальное
const recursiveNextTick = () => {
  process.nextTick(recursiveNextTick)
}

// Promise starvation — аналогично с промисами
const recursivePromise = () => {
  Promise.resolve().then(recursivePromise)
}

// setImmediate — НЕ вызывает starvation (каждый колбэк = отдельная итерация)
```

Проблема в том, что `nextTick` и `Promise` — микротаски. Они выполняются до конца между фазами event loop. Рекурсивный вызов бесконечно пополняет очередь микротасок, не давая event loop перейти к следующей фазе.

#### I/O polling

`setTimeout` и `setImmediate` внутри I/O-колбэка ведут себя предсказуемо — `setImmediate` всегда срабатывает первым:

```typescript
import fs from 'fs'

fs.readFile('file.txt', () => {
  setTimeout(() => console.log('timeout'), 0)   // 2
  setImmediate(() => console.log('immediate'))   // 1
})
```

Суть в следующем: после I/O-колбэка event loop находится в фазе poll, следующая фаза — check (где живёт `setImmediate`), а timers — только на следующей итерации.

#### Blocking / non-blocking

**Файл:** `src/1-event-loop/tasks-event-loop/blocking-and-non-blocking-event-loop.ts`

Техника code-splitting через `setImmediate` для разблокировки event loop:

```typescript
// Один setImmediate — разблокирует ИНОГДА
function non_blocking_sync_sometimes() {
  setImmediate(() => {
    for (let i = 0; i < 1e10; i++) { /* heavy */ }
  })
}

// Двойной setImmediate — разблокирует ВСЕГДА
function non_blocking_sync_always() {
  setImmediate(() => {
    setImmediate(() => {
      for (let i = 0; i < 1e10; i++) { /* heavy */ }
    })
  })
}
```

Один `setImmediate` может не помочь: если на момент вызова event loop уже в фазе check, колбэк выполнится сразу. Двойной `setImmediate` гарантированно переносит выполнение на следующую итерацию.

Здесь же — proof для `bcryptjs`:

- `bcryptjs.hash()` — async-функция, но **не использует** libuv threadpool (вычисления в JS)
- `bcryptjs.hashSync()` — синхронная, блокирует event loop
- `bcrypt.hash()` — async и **использует** libuv threadpool (нативный аддон)

### Промисы

**Файлы:** `src/1-event-loop/promises/`

#### Предсказуемые паттерны (`promises-predictable.ts`)

Промисы с реальными I/O-операциями (fetch, setTimeout) ведут себя предсказуемо — их `.then()` попадает в микротаски после завершения операции:

```typescript
function promiseFetchOrSleep1() {
  console.log(1)
  fetch('https://dummyjson.com/products/1')
    .then(() => {
      console.log(2)
      return fetch('https://dummyjson.com/products/2')
    })
    .then(() => console.log(3))
  console.log(4)
}
// Вывод: 1, 4, 2, 3
```

#### Непредсказуемые паттерны (`promises-unpredictable.ts`)

`Promise.resolve()` создаёт уже зарезолвленный промис, и его `.then()` планируется как микротаска немедленно. Это создаёт неочевидное чередование с другими промисами:

```typescript
function promise1() {
  Promise.resolve()
    .then(() => console.log(1))
    .then(() => console.log(2))
    .then(() => console.log(3))

  Promise.resolve()
    .then(() => console.log(4))
    .then(() => console.log(5))
    .then(() => console.log(6))
}
// Вывод: 1, 4, 2, 5, 3, 6
```

Важный нюанс — поведение `Promise.resolve(promise)` менялось между версиями Node.js (< 10, >= 10, >= 12), и некоторые паттерны помечены как непредсказуемые именно из-за этого.

### Sequential vs Concurrent vs Parallel

**Файлы:** `src/1-event-loop/sequential-vs-concurrent-vs-parallel/`

Сравнение трёх подходов к выполнению HTTP-запросов (13 URL из `dummyjson.com`, `jsonplaceholder.typicode.com`, `cataas.com`):

**Sequential** — запросы выполняются один за другим:

```typescript
async function runSequentialPromises() {
  const id = MeasurePerformance.start()
  for (const url of dummyApiUrls) {
    await axios.get(url) // ждём каждый запрос
  }
  MeasurePerformance.end(id) // ~10 секунд
}
```

**Concurrent** — все запросы стартуют одновременно, ждём завершения всех:

```typescript
async function runConcurrentPromises() {
  const id = MeasurePerformance.start()
  await Promise.all(dummyApiUrls.map(url => axios.get(url)))
  MeasurePerformance.end(id) // ~1.2 секунды
}
```

**Parallel** — настоящий параллелизм возможен только через worker threads (функция-заглушка, отсылает к секции 5).

---

## 2. Async Debugger

**Файлы:** `src/2-async-debugger/`

Инструмент для отслеживания жизненного цикла async-операций, построенный на `async_hooks` API.

Основан на репозитории [debugging-async-operations-in-nodejs](https://github.com/ashleydavis/debugging-async-operations-in-nodejs).

### Принцип работы

`async_hooks.createHook()` регистрирует колбэки на события жизненного цикла: `init`, `destroy`, `promiseResolve`. Каждая async-операция получает уникальный `asyncId` и ссылку на `triggerAsyncId` (кто её породил).

Базовый пример (`examples/1-basic-usage.ts`):

```typescript
import async_hooks from 'async_hooks'

const hook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId, resource) {
    fs.writeSync(1, `Init: id=${asyncId}, type=${type}, trigger=${triggerAsyncId}\n`)
  },
})
hook.enable()

setTimeout(() => console.log('Hello'), 1000)
// Init: id=7, type=Timeout, trigger=1
```

(`console.log` внутри хуков нельзя — это вызовет рекурсию, поэтому используется `fs.writeSync(1, ...)`)

### Класс AsyncDebugger

**Файл:** `src/2-async-debugger/lib/async-debugger.js`

Обёртка над `async_hooks`, которая:

- Отслеживает текущие async-операции (`currentAsyncOperations`)
- Строит дерево вызовов (root -> children)
- Поддерживает лейблы для группировки операций
- Методы: `startTracking(label)`, `notifyComplete(callback)`, `dump()`, `debug(label)`, `traverse()`

Примеры использования (raw `async_hooks`):

| Файл | Что отслеживается |
|---|---|
| `examples/2-usual-suspects.ts` | setTimeout, setInterval, setImmediate, nextTick, Promise |
| `examples/3-io-operations.ts` | fs.readFile |
| `examples/4-external-operations.ts` | HTTP-запросы (axios), MongoDB, bcrypt |
| `examples/5-custom-function.ts` | Цепочки вызовов пользовательских функций |

Примеры использования (`AsyncDebugger` класс, `lib-examples/`):

| Файл | Сценарий |
|---|---|
| `example-1.ts` | Одиночный setTimeout с `notifyComplete` |
| `example-2.ts` | То же + `console.log` до таймаута (влияет на дерево async-операций) |
| `example-3.ts` | Вложенный setTimeout (setTimeout внутри setTimeout) |
| `example-4.ts` | Вложенный setTimeout + вызов `debug()` для вывода дерева |

Пример с вложенными таймаутами (`lib-examples/example-4.ts`):

```typescript
const asyncDebugger = new AsyncDebugger()

function doTimeout() {
  asyncDebugger.startTracking('test-1')
  setTimeout(() => {
    setTimeout(() => {
      asyncDebugger.notifyComplete(() => {
        asyncDebugger.debug('test-1') // дерево всех async-операций
      })
    }, 2000)
  }, 2000)
}
```

---

## 3. Baseline Performance

**Файлы:** `src/3-baseline-performance/`

Три конфигурации Express-сервера для стресс-тестирования через [autocannon](https://github.com/mcollina/autocannon):

```sh
autocannon http://localhost:3000
# или с указанием длительности
autocannon http://localhost:3000 -d 60
```

| Конфигурация | Middleware |
|---|---|
| `1-bare-metal-express.ts` | Нет (пустой ответ) |
| `2-helmet-express.ts` | helmet |
| `3-enable-morgan-express.ts` | helmet + morgan (два экземпляра: полный + фильтрация >=400) |

Суть — измерить overhead каждого middleware на throughput. Bare metal Express без middleware даёт максимальный RPS, каждый слой добавляет задержку.

---

## 4. libuv Threadpool

**Файлы:** `src/4-libuv-threadpool/`

### Что такое libuv threadpool

Node.js использует libuv для I/O-операций. Часть из них (DNS, файловая система, некоторые нативные аддоны) выполняется в пуле потоков. Размер пула по умолчанию — **4 потока**, управляется через `UV_THREADPOOL_SIZE`.

Проблема в том, что задать `UV_THREADPOOL_SIZE` из кода не работает надёжно (через `process.env` или `dotenv`). Единственный стабильный способ:

```sh
UV_THREADPOOL_SIZE=12 node ./build/src/main.js
```

### bcrypt vs bcryptjs

**Файл:** `src/4-libuv-threadpool/1-default-express-threadpool.ts`

Ключевое различие — `bcrypt` (нативный аддон на C++) использует libuv threadpool, `bcryptjs` (чистый JS) — нет.

Результаты стресс-тестов (`/bcrypt` endpoint):

**bcrypt.hash() (async, использует threadpool):**

| UV_THREADPOOL_SIZE | req/sec |
|---|---|
| 1 | 87 |
| 2 | 171 |
| 4 | 300 |
| 8 | 500 |
| 12 | 520 |
| 1000 | 495 |

Производительность растёт с увеличением пула, но не линейно. После 8 потоков (количество логических ядер) прироста нет.

**bcryptjs.hash() (async, НЕ использует threadpool):**

| UV_THREADPOOL_SIZE | req/sec |
|---|---|
| 1 | 51 |
| 12 | 51 |
| 1000 | 51 |

Не зависит от размера пула. Вычисления происходят в основном потоке.

**bcrypt.hashSync() (sync):**

Стабильные ~74 req/sec вне зависимости от `UV_THREADPOOL_SIZE`. Синхронная функция блокирует event loop, threadpool не задействован.

### Динамическая настройка

**Файл:** `src/4-libuv-threadpool/2-dynamic-cpu-express-threadpool.ts`

Попытка задать `UV_THREADPOOL_SIZE` равным количеству логических ядер через `os.cpus().length`. Как отмечено выше — из кода это не работает, нужна переменная окружения при запуске процесса.

Утилита `logical-cpu-info.ts` выводит количество и информацию о логических ядрах через `os.cpus()`.

---

## 5. Worker Threads

**Файлы:** `src/5-worker-thread/`

### Базовый пример

**Файл:** `src/5-worker-thread/1-single-file-worker-thread.ts`

Один файл одновременно является и main-потоком, и воркером. Разделение через `isMainThread`:

```typescript
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'

if (isMainThread) {
  const worker = new Worker(__filename, { workerData: 'hello' })
  worker.on('message', (msg) => console.log(`Worker message received: ${msg}`))
} else {
  parentPort.postMessage(`You said "${workerData}"`)
}
```

### Ресайз изображений

**Файлы:** `src/5-worker-thread/2-resize-image/`

Практический кейс — параллельный ресайз через [sharp](https://github.com/lovell/sharp). Для каждого целевого размера создаётся отдельный воркер:

```typescript
const sizes = [{ width: 1920 }, { width: 1280 }, { width: 640 }]

for (const size of sizes) {
  const worker = new Worker('./resize-worker.js', {
    workerData: { src: 'image.jpg', ...size },
  })
}
```

Воркер (`resize-worker.ts`) получает параметры через `workerData`, ресайзит через `sharp` и отправляет результат через `parentPort.postMessage()`.

### HTTP-сервер с воркерами

**Файлы:** `src/5-worker-thread/3-server/`

Express-сервер с тяжёлой CPU-bound задачей (цикл на 20 000 000 000 итераций). Четыре эндпоинта демонстрируют разницу подходов:

**`/blocking-sync`** и **`/blocking-async`** — оба блокируют event loop. Обёртка в `async`/`Promise` не помогает: CPU-bound операции не используют libuv threadpool, в отличие от I/O-bound.

```typescript
// Это НЕ разблокирует event loop:
async function calculateCountAsync() {
  return new Promise((resolve) => {
    let counter = 0
    for (let i = 0; i < 20_000_000_000; i++) { counter++ }
    resolve(counter)
  })
}
```

**`/heavy-worker`** — один воркер. Не блокирует event loop, но каждый запрос ждёт ~16.5 секунд.

**`/heavy-worker-improved`** — задача разбивается на N воркеров, каждый считает `20_000_000_000 / N` итераций:

```typescript
// Воркер делит работу
for (let i = 0; i < 20_000_000_000 / workerData.thread_count; i++) {
  counter++
}
```

Результаты (время одного запроса, в зависимости от числа воркеров и параллельных запросов):

| Worker threads | 1 запрос | 2 запроса | 3 запроса | 4 запроса |
|---|---|---|---|---|
| 1 | 16.5s | | | |
| 2 | 9.2s | 9.9s | 10.6s | 12s |
| 4 | 4.7s | 6.4s | 8.3s | 11s |
| 6 | 4s | 6.5s | 9.3s | 12.5s |
| 8 | 3.6s | 6s | 8.8s | 11.5s |

Скорость растёт не линейно — есть overhead на создание воркеров и переключение контекста.

---

## 6. Worker Pool

**Файлы:** `src/6-worker-pool/`

### Собственная реализация

**Файлы:** `src/6-worker-pool/1-own-implementation/`

Полноценный worker pool с управлением idle-воркерами и backlog-очередью.

Архитектура:

```
createWorkerpool({ workers: N })
  ├── workers: Map<threadId, Worker>     // N воркеров
  ├── idle: threadId[]                   // свободные воркеры
  ├── resolvers: Map<taskId, resolve>    // ожидающие ответа
  └── backlog: TaskItem[]               // очередь задач
```

Типы определены в `worker.types.ts`:

```typescript
interface Task<data, result> {
  runAsync(data: data): Promise<result>
  map2<result2>(f: (o: result) => result2): Task<data, result2>
  then2<result2>(f: Task<result, result2>): Task<data, result2>
}

interface WorkerPool {
  createTask<data, result>(f: (d: data) => result): Task<data, result>
  terminate(): Promise<void>
}
```

Ключевой механизм: при вызове `runAsync()` задача добавляется в backlog. Если есть idle-воркер — задача отправляется ему немедленно. Функция сериализуется через `.toString()` и выполняется в воркере через `new Function()`:

```typescript
// dynamic-worker.ts — универсальный воркер
parentPort.on('message', (msg) => {
  const { id, callback, data } = msg
  const realCallback = new Function(`return ${callback}`)()
  const result = realCallback(data)
  parentPort.postMessage({ id, result })
})
```

Поддержка композиции задач:

```typescript
const pool = createWorkerpool({ workers: 5 })

const result = await pool
  .createTask(fibonacci)                          // задача 1: fibonacci(30)
  .then2(pool.createTask((res) => res * 2))        // задача 2: результат * 2
  .then2(pool.createTask((res) => 'res is: ' + res)) // задача 3: форматирование
  .runAsync(30)
```

- `map2(f)` — трансформация результата (как `.then()` у промиса, но в том же Task)
- `then2(task)` — цепочка задач (результат первой = вход второй)

### bcrypt workerpool

**Файлы:** `src/6-worker-pool/2-bcrypt-experiments/`

Express-сервер с bcrypt-хэшированием, вынесенным в worker pool (библиотека [workerpool](https://github.com/josdejong/workerpool)).

Архитектура:

1. `controller.ts` — инициализация пула (`WorkerPool.pool(path, options)`) и получение proxy
2. `bcrypt-workerpool.ts` — воркер, регистрирующий функцию через `WorkerPool.worker()`
3. `server.ts` — Express-сервер, использующий proxy для вызова функций в пуле

Три режима хэширования: `sync` (bcrypt.hashSync), `async-with-threadpools` (bcrypt.hash), `async-without-threadpools` (bcryptjs.hash).

Результаты (req/sec) для кода в основном потоке:

| UV_THREADPOOL_SIZE | bcrypt.hash (async) | bcrypt.hashSync (sync) | bcryptjs.hash (async) |
|---|---|---|---|
| 1 | 85 | 60 | 85 |
| 4 | 342 | 60 | 85 |
| 8 | 602 | 60 | 85 |
| 12 | 677 | 60 | 85 |

При использовании workerpool с sync-функцией (`bcrypt.hashSync`) — до **8700** req/sec с 1 воркером. Синхронная функция в workerpool не блокирует основной event loop.

Результаты (req/sec) для bcrypt.hash (async) **через workerpool** при разном числе воркеров в пуле:

| UV_THREADPOOL_SIZE | 1 воркер | 2 воркера | 4 воркера | 6 воркеров | 11 воркеров |
|---|---|---|---|---|---|
| 1 | 85 | 85 | 85 | 85 | 85 |
| 4 | 46 | 170 | 336 | 336 | 330 |
| 8 | 38 | 90 | 262 | 460 | 600 |
| 12 | 41 | 86 | 285 | 460 | 585 |

Результаты (req/sec) для bcryptjs.hash (async, без threadpool) **через workerpool**:

| Воркеров | 1 | 2 | 4 | 6 |
|---|---|---|---|---|
| req/sec | 60 | 120 | 230 | 300 |

Важный нюанс — для sync-функций в workerpool наблюдается деградация при повторных нагрузочных тестах (6500 -> 4400 -> 2400 -> 1300 req/sec). Предположительно, autocannon накапливает запросы, которые не успевают обрабатываться.

### Ресайз видео

**Файлы:** `src/6-worker-pool/3-resize-video/`

Использование `fluent-ffmpeg` внутри воркера для ресайза видео. Пул создаётся через [node-worker-threads-pool](https://github.com/nicoviii/node-worker-threads-pool) (`StaticPool`):

```typescript
const pool = new StaticPool({
  size: 1, // количество воркеров не важно — задача одна
  task: './video-worker.js',
})

await pool.exec({ file: 'video.mp4', size: '1280x720' })
```

### Сравнение workerpool vs worker threads

**Файлы:** `src/6-worker-pool/4-workerpool-vs-worker-threads/`

Один и тот же набор задач (100 job по 1 000 000 000 итераций) выполняется двумя способами:

1. **workerpool** — задачи распределяются библиотекой через пул воркеров
2. **raw worker threads** — задачи разбиваются на чанки (`chunkify`), каждый чанк — отдельный `new Worker()`

Функция `chunkify` делит массив на N примерно равных частей:

```typescript
function chunkify(array, n) {
  const chunks = []
  for (let i = n; i > 0; i--) {
    chunks.push(array.splice(0, Math.ceil(array.length / i)))
  }
  return chunks
}
```

Результаты при обоих подходах практически идентичны — workerpool не добавляет заметного overhead.

---

## 7. Multiprocessing и Clustering

**Файлы:** `src/7-processing-and-clustering/`

### child_process.fork()

**Файлы:** `src/7-processing-and-clustering/1-base-processing/`

Базовый пример IPC (inter-process communication) через `fork()`:

```typescript
// main.ts
const child = fork('./child.js')
child.send(20)
child.on('message', (message) => console.log('Result:', message))

// child.ts
function factorial(n) {
  if (n === 1 || n === 0) return 1
  return factorial(n - 1) * n
}
process.on('message', (n) => {
  process.send(factorial(n))
  process.exit(0)
})
```

Дочерний процесс получает сообщение, вычисляет факториал и отправляет результат обратно.

### Cluster module

**Файлы:** `src/7-processing-and-clustering/2-base-clustering/`

Кластеризация Express-сервера. Primary-процесс работает как балансировщик (round-robin), форкает N-1 воркеров (N = количество CPU):

```typescript
if (cluster.isPrimary) {
  const cpusCount = 3
  for (let i = 0; i < cpusCount - 1; i++) {
    const worker = cluster.fork()
    worker.on('message', (msg) => { /* IPC от воркера */ })
  }

  cluster.on('exit', (worker, code) => {
    if (code === 1) cluster.fork() // восстановление упавшего воркера
  })
}

if (cluster.isWorker) {
  await import('./worker.js') // каждый воркер поднимает Express-сервер
}
```

Результаты стресс-тестов (`/test` endpoint):

| Количество процессов | req/sec |
|---|---|
| 1 | 5300 |
| 2 | 8300 |

Воркер (`worker.ts`) обрабатывает сигналы для graceful shutdown:

- `SIGINT` (Ctrl+C) — закрытие сервера, `exit(0)`
- `SIGTERM` (kill) — закрытие сервера, `exit(0)`
- `SIGUSR2` — закрытие сервера, `exit(1)` (для автоматического перезапуска через `cluster.on('exit')`)

### PM2

**Файл:** `src/7-processing-and-clustering/3-pm2/index.ts`

Заглушка с комментарием: PM2 считается устаревшим решением, сегодня для этих целей используется Docker.

---

## 8. Примитивы синхронизации

**Файлы:** `src/8-sync-primitives-for-parallel-programming/`

Все примеры работают с `SharedArrayBuffer` и `Atomics` в контексте `worker_threads`.

### Mutex

#### Базовое использование

**Файл:** `src/8-sync-primitives-for-parallel-programming/mutex/1-mutex-base.ts`

Демонстрация ownership: один воркер захватывает мьютекс, другой пытается освободить чужой — получает отказ (`leave()` возвращает `false`). Мьютекс безопаснее семафора именно за счёт отслеживания владельца.

#### Реализации

Три реализации Mutex на `SharedArrayBuffer` + `Atomics`:

**Mutex-1** (`Mutex/Mutex-1.ts`) — через `Atomics.exchange` + `Atomics.wait`:

```typescript
enter() {
  let prev = Atomics.exchange(this.lock, 0, LOCKED)
  while (prev !== UNLOCKED) {
    Atomics.wait(this.lock, 0, LOCKED)       // замораживает поток
    prev = Atomics.exchange(this.lock, 0, LOCKED) // пытается захватить
  }
  this.owner = true
}

leave() {
  if (!this.owner) return false
  Atomics.store(this.lock, 0, UNLOCKED)
  Atomics.notify(this.lock, 0, 1)            // будит один ожидающий поток
  this.owner = false
}
```

**Mutex-2** (`Mutex/Mutex-2.ts`) — через `Atomics.compareExchange` (CAS):

```typescript
enter() {
  while (true) {
    if (Atomics.compareExchange(this.lock, 0, UNLOCKED, LOCKED) === UNLOCKED) {
      this.owner = true
      return true
    }
    Atomics.wait(this.lock, 0, LOCKED)
  }
}
```

**Mutex-3 (сломанный)** (`Mutex/Mutex-3-broken.ts`) — намеренно содержит race condition:

```typescript
// BROKEN: между wait и store другой поток может захватить мьютекс
enter() {
  Atomics.wait(this.lock, 0, LOCKED)   // ждём разблокировки
  Atomics.store(this.lock, 0, LOCKED)  // блокируем — но уже поздно!
  this.owner = true
}
```

Проблема в том, что `wait` и `store` — две отдельные операции. Между ними другой поток может успеть выполнить свой `wait` + `store`, и оба потока окажутся "внутри" мьютекса.

#### Race condition на примере Point

**Файлы:** `src/8-sync-primitives-for-parallel-programming/mutex/Point/`

`Point` хранит координаты в `Int32Array` поверх `SharedArrayBuffer`. Два воркера одновременно двигают точку: один на `(1, 1)`, другой на `(-1, -1)`, по 1 000 000 раз каждый.

**Без мьютекса** (`point-race-condition.ts`): итоговые координаты непредсказуемы (не `(0, 0)`), потому что `point.move(x, y)` выполняет два присваивания (`this.x += x; this.y += y`), и между ними может вклиниться другой поток.

**С мьютексом** (`point-no-race.ts`): первые 4 байта `SharedArrayBuffer` — под lock, оставшиеся 8 — под координаты. Итог всегда `(0, 0)`:

```typescript
// SharedArrayBuffer layout: [lock(4 bytes)][x(4 bytes)][y(4 bytes)]
const buffer = new SharedArrayBuffer(12)
const mutex = new Mutex(buffer, 0, true)
const array = new Int32Array(buffer, 4, 2) // offset 4, length 2
const point = new Point(array, 0, 0)
```

#### Deadlock

**Файл:** `src/8-sync-primitives-for-parallel-programming/mutex/2-deadlock.ts`

Классический deadlock — два потока, два мьютекса, перекрёстный захват:

1. Thread #1 входит в mutex #1
2. Thread #2 входит в mutex #2
3. Thread #1 пытается войти в mutex #2 — ждёт
4. Thread #2 пытается войти в mutex #1 — ждёт
5. Оба потока заблокированы навсегда

#### Livelock

**Файлы:** `src/8-sync-primitives-for-parallel-programming/mutex/3-livelock.ts`, `4-livelock-2.ts`

В отличие от deadlock, потоки не замерзают — они активно захватывают и освобождают мьютексы, но не делают полезной работы:

```typescript
// 3-livelock.ts — бесконечный цикл захвата/освобождения
const loop = () => {
  mutex1.enter()
  console.log(`Entered mutex1 from worker${threadId}`)
  mutex1.leave()
  mutex2.enter()
  console.log(`Entered mutex2 from worker${threadId}`)
  mutex2.leave()
  setTimeout(loop, 0)
}
```

Оба потока постоянно захватывают и отпускают мьютексы, но никогда не удерживают оба одновременно.

`4-livelock-2.ts` — вариант с одним мьютексом и задержкой (`setTimeout` на 5 секунд между `enter` и `leave`). Потоки чередуются, но `setInterval` подтверждает, что event loop не заблокирован.

#### Async Mutex

**Файлы:** `src/8-sync-primitives-for-parallel-programming/mutex/5-async/`

Неблокирующий мьютекс для однопоточного контекста. Вместо `Atomics.wait` (который замораживает поток) используется `MessagePort` для уведомлений:

```typescript
enter() {
  return new Promise<void>((resolve) => {
    this.resolve = resolve
    this.trying = true
    this.tryEnter()
  })
}

tryEnter() {
  const prev = Atomics.exchange(this.lock, 0, LOCKED)
  if (prev === UNLOCKED) {
    this.owner = true
    this.trying = false
    this.resolve()
  }
  // если заблокирован — ждём 'leave' сообщение через MessagePort
}
```

`Thread` класс проксирует сообщения между воркерами: когда один воркер отправляет `'leave'`, все остальные получают уведомление и пробуют захватить мьютекс.

### Semaphore

#### Race condition без семафора

**Файл:** `src/8-sync-primitives-for-parallel-programming/semaphore/1-race-condition.ts`

22 потока-"игрока" распределяются по двум группам. Каждый поток читает текущие счётчики и добавляет себя в меньшую группу. Без синхронизации — результат почти никогда не `11 / 11`, потому что несколько потоков одновременно видят одинаковое состояние и выбирают одну группу.

#### Binary semaphore (наивная реализация)

**Файл:** `src/8-sync-primitives-for-parallel-programming/semaphore/2-binary-semaphore-naive.ts`

Busy-wait цикл без атомарных операций:

```typescript
enter() {
  while (this.lock[0] !== UNLOCKED);  // spin-wait
  this.lock[0] = LOCKED
}
```

Работает лучше, чем без семафора, но всё ещё содержит race condition: между проверкой `this.lock[0]` и присваиванием `this.lock[0] = LOCKED` другой поток может проскочить.

#### Binary semaphore с Atomics

**Файлы:** `3-binary-semaphore-with-atomics.ts`, `4-binary-semaphore-with-atomics-2.ts`

Две корректные реализации. Первая — через `Atomics.compareExchange`:

```typescript
enter() {
  while (true) {
    if (Atomics.compareExchange(this.lock, 0, UNLOCKED, LOCKED) === UNLOCKED) return
    Atomics.wait(this.lock, 0, LOCKED)
  }
}

leave() {
  if (Atomics.compareExchange(this.lock, 0, LOCKED, UNLOCKED) !== LOCKED) {
    throw new Error('Cannot leave unlocked BinarySemaphore')
  }
  Atomics.notify(this.lock, 0, 1)
}
```

Также поддерживает `exec(callback)` — выполнение функции внутри критической секции с гарантированным `leave()` через `try/finally`.

Вторая реализация (`4-binary-semaphore-with-atomics-2.ts`) использует `Atomics.exchange` (аналогично Mutex-1).

Отличие семафора от мьютекса: семафор не отслеживает ownership. Любой поток может вызвать `leave()`, в то время как мьютекс разрешает `leave()` только владельцу.

#### Counting semaphore

**Файл:** `src/8-sync-primitives-for-parallel-programming/semaphore/6-counting-semaphore-with-atomics.ts`

Ограничивает количество одновременно работающих потоков. В примере 20 воркеров создают и удаляют тяжёлые файлы, но одновременно работают не более 5 (`MAX_PARALLEL_WORKERS`):

```typescript
enter() {
  while (true) {
    Atomics.wait(this.amountFreeThreads, 0, 0)              // ждём свободный слот
    const n = Atomics.load(this.amountFreeThreads, 0)
    if (n > 0) {
      const prev = Atomics.compareExchange(this.amountFreeThreads, 0, n, n - 1)
      if (prev === n) return  // успешно заняли слот
    }
  }
}

leave() {
  Atomics.add(this.amountFreeThreads, 0, 1)   // освобождаем слот
  Atomics.notify(this.amountFreeThreads, 0, 1)
}
```

Каждый воркер записывает файл (`file-${threadId}.dat`) размером `"Data from ${threadId}".repeat(10_000_000)`, ждёт 1 секунду и удаляет. В корне проекта можно наблюдать, сколько файлов существует одновременно — не более 5.

---

## 9. Модель акторов

**Файл:** `src/9-actors-model/index.ts`

Заглушка со ссылками:

- [Видео: Actor Model](https://www.youtube.com/watch?v=xp5MVKEqxY4)
- [Репозиторий: HowProgrammingWorks/ActorModel](https://github.com/HowProgrammingWorks/ActorModel)

---

## 10. Atomic Benchmarks

Бенчмарки конкурентных операций со счётчиками. N потоков инкрементируют счётчик по 100 000 000 раз — сравниваются стратегии с разной степенью контенции. Перенесено из отдельного проекта `atomic-playground` и сконвертировано в TypeScript/ESM.

```
src/10-atomic-benchmarks/
├── 1-atomics.ts               # Atomics.add, 1 общая ячейка (макс. контенция)
├── 2-sharding.ts              # Atomics.add, по буферу на поток (нулевая контенция)
├── 3-int.ts                   # arr[i]++, шардирование по индексу (без Atomics)
├── 4-non-atomic-sharding.ts   # BigInt64Array, отдельные буферы (не завершён)
├── 5-workerpool-atomic.ts     # workerpool + Atomics.add
├── 6-workerpool-int.ts        # workerpool + шардирование по индексу
└── workers/
    ├── atomic-worker.ts       # Воркер: Atomics.add (для бенчмарка 5)
    └── int-worker.ts          # Воркер: arr[i]++ (для бенчмарка 6)
```

### Сравнительная таблица

| Файл | Потоков | Механизм | Контенция | Корректность |
|---|:---:|---|---|---|
| 1-atomics | 15 | `Atomics.add`, 1 ячейка | Максимальная | Гарантирована |
| 2-sharding | 15 | `Atomics.add`, по буферу на поток | Нулевая | Гарантирована |
| 3-int | 15 | `arr[i]++`, по индексу | Нулевая* | Да |
| 4-non-atomic-sharding | 4 | `BigInt64Array[0]++`, по буферу | Нулевая | Да |
| 5-workerpool-atomic | 4 | `Atomics.add`, workerpool | Максимальная | Гарантирована |
| 6-workerpool-int | 15 | `arr[i]++`, workerpool | Нулевая* | Да |

\* Возможен false sharing на уровне кэш-линий.

Связь с секцией 8: раздел 8 показывает **как синхронизировать потоки** (Mutex, Semaphore), а раздел 10 — **как избежать синхронизации** (шардирование, lock-free).

---

## Стек технологий

### Runtime и сборка

| Пакет | Назначение |
|---|---|
| `typescript` ~5.2 | Компиляция TypeScript |
| `tsx` ^4.17 | Запуск .ts файлов напрямую (без сборки) |
| `ts-node` ^10.9 | Альтернативный TS-раннер |
| `nodemon` ^3.0 | Hot-reload при разработке |

### Серверные

| Пакет | Назначение |
|---|---|
| `express` ^4.18 | HTTP-сервер |
| `helmet` ^7.0 | Security-заголовки |
| `morgan` ^1.10 | HTTP-логирование |

### Криптография и хэширование

| Пакет | Назначение |
|---|---|
| `bcrypt` ^5.1 | Нативный bcrypt (C++, использует libuv threadpool) |
| `bcryptjs` ^2.4 | Чистый JS bcrypt (не использует threadpool) |

### Многопоточность

| Пакет | Назначение |
|---|---|
| `workerpool` ^6.5 | Библиотечный worker pool |
| `node-worker-threads-pool` ^1.5 | StaticPool/DynamicPool для worker threads |

### Обработка медиа

| Пакет | Назначение |
|---|---|
| `sharp` ^0.32 | Ресайз изображений |
| `fluent-ffmpeg` ^2.1 | Обёртка над ffmpeg для видео |

### Прочее

| Пакет | Назначение |
|---|---|
| `axios` ^1.5 | HTTP-клиент |
| `mongoose` ^7.5 | MongoDB ODM (используется в примерах async debugger) |
| `dotenv` ^16.3 | Переменные окружения из .env |

---

## Полезные ссылки

### Видео

1. [Event loop visualization](https://www.youtube.com/shorts/m8biTN2fBEs)
2. [Sequential vs concurrent vs parallel](https://www.youtube.com/watch?v=vC6G7CZPCuY)
3. [Call Stack, Callback Queue, and Event Loop](https://www.youtube.com/watch?v=FVZ-A_Akros)
4. [Non-blocking I/O and how Node uses it](https://www.youtube.com/watch?v=wB9tIg209-8)
5. [Testing For Async Functions In NodeJS](https://www.youtube.com/watch?v=yiBLmRRRx-k)
6. [Асинхронное программирование в JS и Node.js](https://www.youtube.com/watch?v=hY6Z6qNYzmc&list=PLHhi8ymDMrQZ0MpTsmi54OkjTbo0cjU1T)
7. [Параллельное программирование в JS и Node.js](https://www.youtube.com/watch?v=JNLrITevhRI&list=PLHhi8ymDMrQZDYtU8ioC5raX6hxPyWjhx)

### Статьи

1. [Non blocking event loop technique](https://snyk.io/blog/nodejs-how-even-quick-async-functions-can-block-the-event-loop-starve-io)
2. [Event loop animated](https://dev.to/nodedoctors/an-animated-guide-to-nodejs-event-loop-3g62)
3. [Next tick and promises queues](https://www.builder.io/blog/NodeJS-visualizing-nextTick-and-promise-queues)
4. [Event loop phases](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick#phases-overview)
5. [Promise execution tracking](https://nodejs.org/api/async_hooks.html#async_hooks_type)
6. [How event loop works](https://heynode.com/tutorial/how-event-loop-works-nodejs/)
7. [The Node.js Event Loop, Timers, and process.nextTick()](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick)
8. [Don't Block the Event Loop (or the Worker Pool)](https://nodejs.org/en/docs/guides/dont-block-the-event-loop)
9. [Benchmarking Node.js Worker Threads](https://dhwaneetbhatt.com/blog/benchmarking-nodejs-worker-threads)
10. [Inter-processing communication](https://github.com/HowProgrammingWorks/InterProcessCommunication)
11. [Parallel programming](https://github.com/HowProgrammingWorks/Index/blob/master/Courses/Parallel.md)

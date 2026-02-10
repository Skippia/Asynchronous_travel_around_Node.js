import threads from 'worker_threads'
import url from 'url'
const __filename = url.fileURLToPath(import.meta.url)

const { Worker, isMainThread } = threads

/**
 * ! Практически никогда мы не получим 11 / 11
 * ? Это происходит по той причине, что в критическую секцию (код проверки количества игроков в группах и выбора одной из них)
 * ? одновременно могут войти сразу несколько потоков. Это похоже на то, как игроки выходя на поле и увидев,
 * ? что группы наполнены одинаково, оба отправляются в одну и ту же группу.
 * ? Этого можно было бы избежать, если бы один из игроков дождался решения другого.
 */

if (isMainThread) {
  // Инициализируем буфер c двумя счетчиками
  // [*делают броски*, *тренируют катание*]
  const buffer = new SharedArrayBuffer(2)

  // Запускам/выпускаем не площадку 22 потока-игрока
  for (let i = 0; i < 22; i++) {
    new Worker(__filename, { workerData: buffer })
  }

  // Проверяем итоговое распределение по группам после разминки
  setTimeout(() => {
    const array = new Int8Array(buffer, 0)
    console.log(`Делали броски: ${array[0]}`)
    console.log(`Тренировали катание: ${array[1]}`)
  }, 1000)
} else {
  const { threadId, workerData } = threads
  const array = new Int8Array(workerData, 0)
  const [doKicks, doSkating] = array

  console.log(`На лед выходит ${threadId}.`)

  if (doKicks === doSkating) {
    array[1]++
  } else {
    array[0]++
  }
}

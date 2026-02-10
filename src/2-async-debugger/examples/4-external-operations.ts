import axios from 'axios'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { AsyncDebugger } from '../lib/async-debugger'

export function externalFunctions() {
  const asyncDebugger = new AsyncDebugger()

  // TEST FUNCTIONS
  const testHTTP = async () => {
    await axios.get('https://agilite.io')
  }

  const testMongo = async () => {
    await mongoose.connect('mongodb://localhost/test')
    mongoose.disconnect()
  }

  const testBCrypt = () => {
    const saltRounds = 10
    const myPlaintextPassword = 'changemenow'

    bcrypt.genSalt(saltRounds, (err, salt) => {
      if (err) throw new Error(JSON.stringify(err))

      bcrypt.hash(myPlaintextPassword, salt, (err, hash) => {
        if (err) throw new Error(JSON.stringify(err))
      })
    })
  }

  // ASYNC TRACKER
  asyncDebugger.startTracking('Test', testHTTP)
}

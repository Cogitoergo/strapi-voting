const axios = require('axios')
const recaptchaSecret = '6Lcc7OckAAAAAGOEYct4V8b-CjlaVaCRviTaYgnN'
const recaptchaVerifyUrl = 'https://www.google.com/recaptcha/api/siteverify'

module.exports = {
  verifyRecaptcha: async token => {
    try {
      const url = `${recaptchaVerifyUrl}?secret=${recaptchaSecret}&response=${token}`
      const recaptchaResponse = await axios(url)
      const recaptchaResponseJson = recaptchaResponse.data

      console.log(`[RECAPTCHA VERIFY]: ${recaptchaResponseJson}, ${recaptchaResponseJson}`)

      return recaptchaResponseJson
    } catch (err) {
      console.log(err)
    }
  }
}
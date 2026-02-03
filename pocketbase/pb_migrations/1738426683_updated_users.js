/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "authAlert": {
      "emailTemplate": {
        "subject": "[sptfyin] Login from a new location"
      }
    },
    "confirmEmailChangeTemplate": {
      "subject": "[sptfyin] Confirm your {APP_NAME} new email address"
    },
    "otp": {
      "emailTemplate": {
        "subject": "[sptfyin] OTP for {APP_NAME}"
      }
    },
    "resetPasswordTemplate": {
      "subject": "[sptfyin] Reset your {APP_NAME} password"
    },
    "verificationTemplate": {
      "subject": "[sptfyin] Verify your {APP_NAME} email"
    }
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "authAlert": {
      "emailTemplate": {
        "subject": "Login from a new location"
      }
    },
    "confirmEmailChangeTemplate": {
      "subject": "Confirm your {APP_NAME} new email address"
    },
    "otp": {
      "emailTemplate": {
        "subject": "OTP for {APP_NAME}"
      }
    },
    "resetPasswordTemplate": {
      "subject": "Reset your {APP_NAME} password"
    },
    "verificationTemplate": {
      "subject": "Verify your {APP_NAME} email"
    }
  }, collection)

  return app.save(collection)
})

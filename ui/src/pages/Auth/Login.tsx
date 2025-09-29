// pages/Auth/Login.tsx
import AuthLayout from "../../components/layout/AuthLayout"
import Button from "../../components/common/Button"
import Input from "../../components/forms/Input"
import { useState, type FormEvent } from "react"

function Login() {
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Honeypot check
    if (formData.get("extra_field")) {
      setError("Bot detected 🚫")
      return
    }

    const email = formData.get("email") as string
    const password = formData.get("password") as string

    console.log({ email, password }) // replace with auth call
    setError(null)
  }

  return (
    <AuthLayout>
      <div className="flow">
        {/* Fun title + description */}
        <h1 className="text-2xl font-bold text-center">Welcome Back 🎉</h1>
        <p className="text-gray-600 text-center">
          Log in and continue your journey with us 🚀
        </p>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="flow">
          <Input label="Email" type="email" name="email" required={true} />

          <Input
            label="Password"
            type="password"
            name="password"
            required={true}
          />

          {/* Honeypot field (hidden from real users) */}
          <input
            type="text"
            name="extra_field"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Error message */}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Submit button */}
          <Button type="submit" onClick={() => {}}>
            Login
          </Button>
        </form>
      </div>
    </AuthLayout>
  )
}

export default Login

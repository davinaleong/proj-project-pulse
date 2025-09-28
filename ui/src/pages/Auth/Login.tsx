// pages/Auth/Login.tsx
import AuthLayout from "../../components/layout/AuthLayout"
import Button from "../../components/common/Button"
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

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    console.log({ name, email, password }) // replace with auth call
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
          <div className="flow">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full rounded-sm bg-gray-100 px-[1em] py-[0.5em] shadow-inner focus:outline-none focus:ring-2 focus:ring-pp-teal-500"
            />
          </div>

          <div className="flow">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="block w-full rounded-sm bg-gray-100 px-[1em] py-[0.5em] shadow-inner focus:outline-none focus:ring-2 focus:ring-pp-teal-500"
            />
          </div>

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

export default ({ handleLogin }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const { email } = e.target.elements

    handleLogin(email.value)
  }

  return (
    <>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="e.g. abc@gmail.com" />
        <input type="submit" value="Login" />
      </form>
    </>
  );
}
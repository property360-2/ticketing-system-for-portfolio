import { RouterProvider } from 'react-router-dom'
import { Providers } from './app/providers'
import { router } from './app/router'
import { ServerStartupScreen } from './components/startup/ServerStartupScreen'

function App() {
  return (
    <ServerStartupScreen>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ServerStartupScreen>
  )
}

export default App

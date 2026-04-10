import { useGameStore } from './store/gameStore'
import StartScreen from './components/StartScreen'
import SettingsScreen from './components/SettingsScreen'
import GameScreen from './components/GameScreen'

export default function App() {
  const screen = useGameStore((s) => s.screen)

  return (
    <>
      {screen === 'start' && <StartScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'game' && <GameScreen />}
    </>
  )
}

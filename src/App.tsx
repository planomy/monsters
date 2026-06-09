import { Header } from './components/Header'
import { StudentGrid } from './components/StudentGrid'
import { useMonsterz } from './hooks/useMonsterz'
import { useTheme } from './hooks/useTheme'
import './App.css'

function App() {
  const {
    state,
    saveStatus,
    history,
    totalTallies,
    incrementTally,
    decrementTally,
    rewardAll,
    undoLast,
    updateName,
    setClassName,
    resetAllTallies,
    resetToDefaults,
    manualSave,
    importState,
  } = useMonsterz()
  const { preference: themePreference, setPreference: setThemePreference } = useTheme()

  return (
    <div className="app">
      <Header
        state={state}
        totalTallies={totalTallies}
        saveStatus={saveStatus}
        canUndo={history.length > 0}
        onClassNameChange={setClassName}
        onSave={manualSave}
        onRewardAll={rewardAll}
        onUndo={undoLast}
        onResetTallies={resetAllTallies}
        onResetAll={resetToDefaults}
        onImport={(file) => {
          importState(file).catch((err: Error) => {
            window.alert(err.message || 'Could not import file.')
          })
        }}
        themePreference={themePreference}
        onThemeChange={setThemePreference}
      />

      <main className="app__main">
        <p className="app__hint">
          Tap a card to award a tally · Shift+click or right-click to remove one · Double-click a name to rename
        </p>
        <StudentGrid
          students={state.students}
          onIncrement={incrementTally}
          onDecrement={decrementTally}
          onRename={updateName}
        />
      </main>

      <footer className="app__footer">
        <p>Monsterz — built for morning greetings, camera moments, and classroom wins.</p>
      </footer>
    </div>
  )
}

export default App

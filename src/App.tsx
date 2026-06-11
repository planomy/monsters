import { useCallback, useState } from 'react'
import { Header } from './components/Header'
import { PickStudentModal } from './components/PickStudentModal'
import { ShuffleOrderModal } from './components/ShuffleOrderModal'
import { StudentGrid } from './components/StudentGrid'
import { useMonsterz } from './hooks/useMonsterz'
import { useTheme } from './hooks/useTheme'
import { useUiScale } from './hooks/useUiScale'
import type { Student } from './types'
import './App.css'

interface PickModalState {
  student: Student | null
  remaining: number
  cycleSize: number
}

function App() {
  const {
    state,
    saveStatus,
    history,
    totalTallies,
    presentCount,
    absentCount,
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
    toggleAbsent,
    pickRandomStudent,
    resetPickerCycle,
    shuffleClassOrder,
  } = useMonsterz()
  const {
    preference: themePreference,
    gradientId,
    resolved: themeResolved,
    setPreference: setThemePreference,
    setGradientId,
  } = useTheme()
  const {
    scaleId: uiScaleId,
    setScaleId: setUiScaleId,
    increase: increaseUiScale,
    decrease: decreaseUiScale,
    canDecrease: canDecreaseUiScale,
    canIncrease: canIncreaseUiScale,
  } = useUiScale()

  const [pickModal, setPickModal] = useState<PickModalState | null>(null)
  const [shuffleStudents, setShuffleStudents] = useState<Student[] | null>(null)
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null)

  const highlightStudent = useCallback((studentId: string) => {
    setHighlightedStudentId(studentId)
    window.setTimeout(() => {
      document.getElementById(`student-${studentId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }, 50)
    window.setTimeout(() => setHighlightedStudentId(null), 2500)
  }, [])

  const runPick = useCallback(() => {
    const result = pickRandomStudent()
    setPickModal(result)
    if (result.student) highlightStudent(result.student.id)
    return result
  }, [highlightStudent, pickRandomStudent])

  const openShuffle = useCallback(() => {
    setShuffleStudents(shuffleClassOrder())
  }, [shuffleClassOrder])

  const copyShuffleList = useCallback(() => {
    if (!shuffleStudents?.length) return
    const text = shuffleStudents.map((student, index) => `${index + 1}. ${student.name}`).join('\n')
    navigator.clipboard.writeText(text).catch(() => {
      window.alert('Could not copy to clipboard.')
    })
  }, [shuffleStudents])

  return (
    <div className="app">
      <Header
        state={state}
        totalTallies={totalTallies}
        presentCount={presentCount}
        absentCount={absentCount}
        saveStatus={saveStatus}
        canUndo={history.length > 0}
        onClassNameChange={setClassName}
        onSave={manualSave}
        onRewardAll={rewardAll}
        onPickStudent={runPick}
        onShuffleOrder={openShuffle}
        onUndo={undoLast}
        onResetTallies={resetAllTallies}
        onResetAll={resetToDefaults}
        onImport={(file) => {
          importState(file).catch((err: Error) => {
            window.alert(err.message || 'Could not import file.')
          })
        }}
        themePreference={themePreference}
        themeResolved={themeResolved}
        gradientId={gradientId}
        onThemeChange={setThemePreference}
        onGradientChange={setGradientId}
        uiScaleId={uiScaleId}
        onUiScaleChange={setUiScaleId}
        onUiScaleDecrease={decreaseUiScale}
        onUiScaleIncrease={increaseUiScale}
        canDecreaseUiScale={canDecreaseUiScale}
        canIncreaseUiScale={canIncreaseUiScale}
      />

      <main className="app__main">
        <p className="app__hint">
          Tap a card to award a tally · Shift+click or right-click to remove one · Double-click a name to rename · Away marks absent
        </p>
        <StudentGrid
          students={state.students}
          highlightedStudentId={highlightedStudentId}
          onIncrement={incrementTally}
          onDecrement={decrementTally}
          onRename={updateName}
          onToggleAbsent={toggleAbsent}
        />
      </main>

      <footer className="app__footer">
        <p>Monsterz — built for morning greetings, camera moments, and classroom wins.</p>
      </footer>

      {pickModal && (
        <PickStudentModal
          student={pickModal.student}
          remaining={pickModal.remaining}
          cycleSize={pickModal.cycleSize}
          onPickAgain={() => {
            const result = runPick()
            setPickModal(result)
          }}
          onResetCycle={() => {
            resetPickerCycle()
            const result = runPick()
            setPickModal(result)
          }}
          onClose={() => setPickModal(null)}
        />
      )}

      {shuffleStudents && (
        <ShuffleOrderModal
          students={shuffleStudents}
          absentCount={absentCount}
          onReshuffle={() => setShuffleStudents(shuffleClassOrder())}
          onCopy={copyShuffleList}
          onClose={() => setShuffleStudents(null)}
        />
      )}
    </div>
  )
}

export default App

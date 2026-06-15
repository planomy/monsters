import { useEffect, useRef, useState } from 'react'
import type { ThemePreference } from '../hooks/useTheme'
import {
  MAX_CLASS_SIZE,
  MIN_CLASS_SIZE,
} from '../data/defaults'
import type { AppState } from '../types'
import type { SavedClass } from '../utils/classLibrary'
import { getDailyMonsterIndex } from '../utils/dailyMonster'
import { exportToCsv, exportToJson } from '../utils/export'
import { activateEmbeddedStorage } from '../utils/storage'
import { ConfirmModal } from './ConfirmModal'
import { MonsterAvatar } from './MonsterAvatar'
import { PromptModal } from './PromptModal'

type ConfirmAction = 'reset-tallies' | 'reset-all' | 'delete-class'

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Auto' },
]

interface HeaderProps {
  state: AppState
  questionsExpanded: boolean
  onQuestionsToggle: () => void
  totalTallies: number
  presentCount: number
  absentCount: number
  assignedCount: number
  saveStatus: 'saved' | 'saving' | 'idle'
  canUndo: boolean
  onClassNameChange: (name: string) => void
  onSave: () => void
  onRewardAll: () => void
  onPickStudent: () => void
  onShuffleOrder: () => void
  onUndo: () => void
  onResetTallies: () => void
  onResetAll: () => void
  onImport: (file: File) => void
  onClassSizeChange: (count: number) => void
  savedClasses: SavedClass[]
  activeClassId: string
  onSwitchClass: (classId: string) => void
  onNewClass: (name: string) => void
  onDeleteClass: (classId: string) => boolean
  onRenameClass: (classId: string, name: string) => boolean
  onDuplicateClass: (classId: string, name: string) => boolean
  themePreference: ThemePreference
  onThemeChange: (theme: ThemePreference) => void
  onUiScaleDecrease: () => void
  onUiScaleIncrease: () => void
  canDecreaseUiScale: boolean
  canIncreaseUiScale: boolean
  floatModeActive: boolean
  onOpenFloatMode: () => void
}

function GearIcon() {
  return (
    <svg className="header__gear-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
      />
    </svg>
  )
}

export function Header({
  state,
  questionsExpanded,
  onQuestionsToggle,
  totalTallies,
  presentCount,
  absentCount,
  assignedCount,
  saveStatus,
  canUndo,
  onClassNameChange,
  onSave,
  onRewardAll,
  onPickStudent,
  onShuffleOrder,
  onUndo,
  onResetTallies,
  onResetAll,
  onImport,
  onClassSizeChange,
  savedClasses,
  activeClassId,
  onSwitchClass,
  onNewClass,
  onDeleteClass,
  onRenameClass,
  onDuplicateClass,
  themePreference,
  onThemeChange,
  onUiScaleDecrease,
  onUiScaleIncrease,
  canDecreaseUiScale,
  canIncreaseUiScale,
  floatModeActive,
  onOpenFloatMode,
}: HeaderProps) {
  const dailyMonsterIndex = getDailyMonsterIndex()
  const fileRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [showNewClassPrompt, setShowNewClassPrompt] = useState(false)
  const [pendingDeleteClassId, setPendingDeleteClassId] = useState<string | null>(null)
  const [renameClassId, setRenameClassId] = useState<string | null>(null)
  const [duplicateClassId, setDuplicateClassId] = useState<string | null>(null)

  const classSize = state.classSize

  const saveLabel =
    saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save'

  const lastSavedText = state.lastSaved
    ? new Date(state.lastSaved).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const openMenu = () => {
    void activateEmbeddedStorage()
    setMenuOpen((open) => !open)
  }

  const runConfirmedAction = () => {
    void activateEmbeddedStorage().finally(() => {
      if (confirmAction === 'reset-tallies') onResetTallies()
      if (confirmAction === 'reset-all') onResetAll()
      if (confirmAction === 'delete-class' && pendingDeleteClassId) {
        onDeleteClass(pendingDeleteClassId)
        setPendingDeleteClassId(null)
      }
      setConfirmAction(null)
      closeMenu()
    })
  }

  const requestClassSize = (nextCount: number) => {
    if (nextCount === classSize) return
    if (nextCount < MIN_CLASS_SIZE || nextCount > MAX_CLASS_SIZE) return
    onClassSizeChange(nextCount)
  }

  return (
    <header className="header">
      <div className="header__bar">
        <div className="header__brand">
          <div className="header__logo" aria-hidden="true">
            <span>M</span>
          </div>
          <h1 className="header__title">Monsterz</h1>
        </div>

        <div className="header__class-wrap">
          <label className="sr-only" htmlFor="class-name">
            Class name
          </label>
          <input
            id="class-name"
            className="header__class-input"
            value={state.className}
            onChange={(e) => onClassNameChange(e.target.value)}
            placeholder="Class name"
          />
        </div>

        <div className="header__chips" aria-label="Class summary">
          <span
            className="header__chip header__chip--status"
            aria-label={`${absentCount} not logged on, ${presentCount} logged on`}
          >
            <span className="header__status-item">
              <span className="header__status-dot header__status-dot--away" aria-hidden="true" />
              <strong>{absentCount}</strong>
            </span>
            <span className="header__status-sep" aria-hidden="true">
              /
            </span>
            <span className="header__status-item">
              <span className="header__status-dot header__status-dot--present" aria-hidden="true" />
              <strong>{presentCount}</strong>
            </span>
          </span>
          <span className="header__chip header__chip--tally">
            <strong>{totalTallies}</strong> tallies
          </span>
        </div>

        <button
          type="button"
          className="header__pick"
          onClick={onPickStudent}
          disabled={presentCount === 0}
        >
          PICK
        </button>

        <button
          type="button"
          className={
            questionsExpanded
              ? 'header__questions header__questions--active'
              : 'header__questions'
          }
          aria-pressed={questionsExpanded}
          aria-label={questionsExpanded ? 'Hide questions panel' : 'Show questions panel'}
          onClick={onQuestionsToggle}
        >
          {questionsExpanded ? 'Hide Questions' : 'Show Questions'}
        </button>

        <button
          type="button"
          className="header__reward"
          onClick={onRewardAll}
          disabled={assignedCount === 0}
          title={
            assignedCount === 0
              ? 'Rename at least one student to enable reward all'
              : `Reward ${assignedCount} named students`
          }
        >
          REWARD ALL
        </button>

        <button
          type="button"
          className={floatModeActive ? 'header__float header__float--active' : 'header__float'}
          onClick={onOpenFloatMode}
          aria-pressed={floatModeActive}
        >
          FLOAT
        </button>

        <div className="header__size" role="group" aria-label="Card size">
          <button
            type="button"
            className="header__size-btn"
            onClick={onUiScaleDecrease}
            disabled={!canDecreaseUiScale}
            aria-label="Smaller cards"
          >
            −
          </button>
          <div className="header__size-mascot" title="Today's card-size buddy">
            <MonsterAvatar index={dailyMonsterIndex} name="Card size buddy" />
          </div>
          <button
            type="button"
            className="header__size-btn"
            onClick={onUiScaleIncrease}
            disabled={!canIncreaseUiScale}
            aria-label="Larger cards"
          >
            +
          </button>
        </div>

        <div className="header__menu" ref={menuRef}>
          <button
            type="button"
            className="header__gear"
            onClick={openMenu}
            aria-label="Settings and tools"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <GearIcon />
          </button>

          {menuOpen && (
            <div className="header__dropdown" role="menu">
              <div className="header__theme" role="group" aria-label="Appearance">
                <span className="header__theme-label">Appearance</span>
                <div className="header__theme-options">
                  {THEME_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      className={
                        themePreference === value
                          ? 'header__theme-btn header__theme-btn--active'
                          : 'header__theme-btn'
                      }
                      aria-pressed={themePreference === value}
                      onClick={() => onThemeChange(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="header__menu-divider" role="separator" />
              <div className="header__class-size" role="group" aria-label="Students in class">
                <span className="header__theme-label">Students in class</span>
                <p className="header__class-size-hint">Hide extra cards; names and marks are kept.</p>
                <div className="header__class-size-control">
                  <button
                    type="button"
                    className="header__class-size-btn"
                    onClick={() => requestClassSize(classSize - 1)}
                    disabled={classSize <= MIN_CLASS_SIZE}
                    aria-label="Remove student card"
                  >
                    −
                  </button>
                  <span className="header__class-size-value" aria-live="polite">
                    {classSize}
                  </span>
                  <button
                    type="button"
                    className="header__class-size-btn"
                    onClick={() => requestClassSize(classSize + 1)}
                    disabled={classSize >= MAX_CLASS_SIZE}
                    aria-label="Add student card"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="header__menu-divider" role="separator" />
              <div className="header__saved-classes" role="group" aria-label="Saved classes">
                <span className="header__theme-label">Saved classes</span>
                <p className="header__class-size-hint">Switch between classes; each keeps its own roster.</p>
                <ul className="header__saved-list">
                  {savedClasses.map((savedClass) => {
                    const isActive = savedClass.id === activeClassId
                    const deleteLabel = `Delete ${savedClass.name}`
                    const renameLabel = `Rename ${savedClass.name}`
                    const duplicateLabel = `Duplicate ${savedClass.name}`
                    return (
                      <li key={savedClass.id} className="header__saved-item">
                        <button
                          type="button"
                          className={
                            isActive
                              ? 'header__saved-load header__saved-load--active'
                              : 'header__saved-load'
                          }
                          aria-current={isActive ? 'true' : undefined}
                          onClick={() => {
                            if (!isActive) onSwitchClass(savedClass.id)
                          }}
                        >
                          <span className="header__saved-name">{savedClass.name}</span>
                          {isActive && (
                            <span className="header__saved-badge" aria-hidden="true">
                              Active
                            </span>
                          )}
                        </button>
                        <div className="header__saved-actions">
                          <button
                            type="button"
                            className="header__saved-action"
                            aria-label={renameLabel}
                            title="Rename"
                            onClick={() => setRenameClassId(savedClass.id)}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="header__saved-action"
                            aria-label={duplicateLabel}
                            title="Duplicate"
                            onClick={() => setDuplicateClassId(savedClass.id)}
                          >
                            ⧉
                          </button>
                          {savedClasses.length > 1 && (
                            <button
                              type="button"
                              className="header__saved-action header__saved-action--danger"
                              aria-label={deleteLabel}
                              title="Delete"
                              onClick={() => {
                                setPendingDeleteClassId(savedClass.id)
                                setConfirmAction('delete-class')
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <button
                  type="button"
                  className="header__saved-add"
                  onClick={() => setShowNewClassPrompt(true)}
                >
                  + New class
                </button>
              </div>
              <div className="header__menu-divider" role="separator" />
              <button
                type="button"
                className="header__menu-item"
                role="menuitem"
                onClick={() => {
                  onPickStudent()
                  closeMenu()
                }}
                disabled={presentCount === 0}
              >
                Pick random student
              </button>
              <button
                type="button"
                className="header__menu-item"
                role="menuitem"
                onClick={() => {
                  onShuffleOrder()
                  closeMenu()
                }}
                disabled={presentCount === 0}
              >
                Random class list
              </button>
              <div className="header__menu-divider" role="separator" />
              <button
                type="button"
                className="header__menu-item"
                role="menuitem"
                onClick={() => {
                  onUndo()
                  closeMenu()
                }}
                disabled={!canUndo}
              >
                Undo
              </button>
              <button
                type="button"
                className="header__menu-item"
                role="menuitem"
                onClick={() => {
                  onSave()
                  closeMenu()
                }}
              >
                {saveLabel}
              </button>
              <div className="header__menu-divider" role="separator" />
              <button
                type="button"
                className="header__menu-item"
                role="menuitem"
                onClick={() => {
                  exportToCsv(state)
                  closeMenu()
                }}
              >
                Export CSV
              </button>
              <button
                type="button"
                className="header__menu-item"
                role="menuitem"
                onClick={() => {
                  exportToJson(state)
                  closeMenu()
                }}
              >
                Export JSON
              </button>
              <button
                type="button"
                className="header__menu-item"
                role="menuitem"
                onClick={() => fileRef.current?.click()}
              >
                Import
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onImport(file)
                  e.target.value = ''
                  closeMenu()
                }}
              />
              <div className="header__menu-divider" role="separator" />
              <button
                type="button"
                className="header__menu-item header__menu-item--danger"
                role="menuitem"
                onClick={() => setConfirmAction('reset-tallies')}
              >
                Reset tallies
              </button>
              <button
                type="button"
                className="header__menu-item header__menu-item--danger"
                role="menuitem"
                onClick={() => setConfirmAction('reset-all')}
              >
                Reset all
              </button>
              {lastSavedText && (
                <p className="header__menu-footer">Last saved {lastSavedText}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {confirmAction === 'reset-tallies' && (
        <ConfirmModal
          title="Reset tallies?"
          message="Set every student back to zero. Names and monsters stay the same."
          confirmLabel="Reset tallies"
          onConfirm={runConfirmedAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'reset-all' && (
        <ConfirmModal
          title="Reset everything?"
          message="Clear all names, tallies, and class name back to defaults. This cannot be undone."
          confirmLabel="Reset all"
          onConfirm={runConfirmedAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'delete-class' && pendingDeleteClassId && (
        <ConfirmModal
          title="Delete saved class?"
          message={`Remove "${
            savedClasses.find((entry) => entry.id === pendingDeleteClassId)?.name ?? 'this class'
          }" from your saved classes? This cannot be undone.`}
          confirmLabel="Delete class"
          onConfirm={runConfirmedAction}
          onCancel={() => {
            setConfirmAction(null)
            setPendingDeleteClassId(null)
          }}
        />
      )}

      {showNewClassPrompt && (
        <PromptModal
          title="New class"
          message="Create a fresh roster. Your current class is saved automatically."
          label="Class name"
          defaultValue="New Class"
          confirmLabel="Create class"
          onConfirm={(name) => {
            onNewClass(name)
            setShowNewClassPrompt(false)
            closeMenu()
          }}
          onCancel={() => setShowNewClassPrompt(false)}
        />
      )}

      {renameClassId && (
        <PromptModal
          title="Rename class"
          label="Class name"
          defaultValue={savedClasses.find((entry) => entry.id === renameClassId)?.name ?? ''}
          confirmLabel="Rename"
          onConfirm={(name) => {
            onRenameClass(renameClassId, name)
            setRenameClassId(null)
          }}
          onCancel={() => setRenameClassId(null)}
        />
      )}

      {duplicateClassId && (
        <PromptModal
          title="Duplicate class"
          message="Copy this roster, tallies, and questions into a new saved class."
          label="New class name"
          defaultValue={`${savedClasses.find((entry) => entry.id === duplicateClassId)?.name ?? 'Class'} copy`}
          confirmLabel="Duplicate"
          onConfirm={(name) => {
            onDuplicateClass(duplicateClassId, name)
            setDuplicateClassId(null)
            closeMenu()
          }}
          onCancel={() => setDuplicateClassId(null)}
        />
      )}

    </header>
  )
}

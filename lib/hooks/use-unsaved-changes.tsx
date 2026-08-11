"use client"

import { createContext, useCallback, useContext, useEffect, useRef } from "react"

interface UnsavedChangesContextValue {
    setDirty: (dirty: boolean) => void
    isDirty: () => boolean
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null)

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
    const dirtyRef = useRef(false)

    const setDirty = useCallback((dirty: boolean) => {
        dirtyRef.current = dirty
    }, [])

    const isDirty = useCallback(() => dirtyRef.current, [])

    return (
        <UnsavedChangesContext.Provider value={{ setDirty, isDirty }}>
            {children}
        </UnsavedChangesContext.Provider>
    )
}

/**
 * Registers this component's dirty state with the global tracker so the
 * Android hardware back button (and future navigation guards) can warn
 * before discarding it. Call from a form with a boolean that's true once
 * the user has entered data.
 */
export function useUnsavedChanges() {
    const ctx = useContext(UnsavedChangesContext)
    if (!ctx) throw new Error("useUnsavedChanges must be used within UnsavedChangesProvider")
    return ctx
}

/**
 * Convenience wrapper: keeps the global dirty flag in sync with a boolean
 * for the lifetime of the calling form, and clears it when the form unmounts
 * (dialog closed, navigated away, or submitted successfully).
 */
export function useTrackDirty(dirty: boolean) {
    const { setDirty } = useUnsavedChanges()

    useEffect(() => {
        setDirty(dirty)
    }, [dirty, setDirty])

    useEffect(() => () => setDirty(false), [setDirty])
}

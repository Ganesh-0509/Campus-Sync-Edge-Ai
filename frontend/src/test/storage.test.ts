import { describe, it, expect } from 'vitest'
import { storageKey, getItem, setItem, removeItem } from '../utils/storage'

describe('storage utility', () => {
    it('creates prefixed key without user', () => {
        expect(storageKey('theme')).toBe('cse_theme')
    })

    it('creates prefixed key with user', () => {
        expect(storageKey('theme', 'u@example.com')).toBe('u@example.com_cse_theme')
    })

    it('does not double-prefix', () => {
        expect(storageKey('cse_theme')).toBe('cse_theme')
    })

    it('getItem returns null for missing key', () => {
        expect(getItem('nonexistent_key_xyz')).toBeNull()
    })

    it('setItem + getItem round-trips', () => {
        setItem('test_round_trip', { hello: 'world' })
        expect(getItem('test_round_trip')).toEqual({ hello: 'world' })
        removeItem('test_round_trip')
    })

    it('removeItem clears the key', () => {
        setItem('test_remove', 42)
        removeItem('test_remove')
        expect(getItem('test_remove')).toBeNull()
    })
})

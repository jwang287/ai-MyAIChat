import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SIDEBAR_FULL_THRESHOLD } from '../constants'
import { Sidebar } from '../Sidebar'

describe('Sidebar', () => {
  it('persists the full sidebar width when the floating sidebar is pinned open', async () => {
    const user = userEvent.setup()
    const setWidth = vi.fn()

    render(
      <Sidebar
        width={0}
        setWidth={setWidth}
        entries={[]}
        active={{ activeItem: '' }}
        isFloating
        pinLabel="Show Sidebar"
      />
    )

    await user.click(screen.getByRole('button', { name: 'Show Sidebar' }))

    expect(setWidth).toHaveBeenCalledWith(SIDEBAR_FULL_THRESHOLD)
  })
})

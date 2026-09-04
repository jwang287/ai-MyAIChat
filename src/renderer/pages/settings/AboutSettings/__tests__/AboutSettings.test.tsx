import '@testing-library/jest-dom/vitest'

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  request: vi.fn()
}))

vi.mock('@renderer/ipc', () => ({
  ipcApi: { request: mocks.request }
}))

vi.mock('@renderer/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light' })
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

// Forwards alt so empty-alt decorative logos stay hidden even without the wrapper.
vi.mock('@renderer/components/icons/LogoAvatar', () => ({
  default: ({ logo, alt }: { logo: string; alt?: string }) => <img src={logo} alt={alt} />
}))

import { AboutSettings } from '..'

const REPOSITORY_URL = 'https://github.com/CherryHQ/cherry-studio'

async function renderAboutSettings() {
  render(<AboutSettings />)
  await waitFor(() => expect(mocks.request).toHaveBeenCalledWith('app.get_info'))
}

describe('AboutSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.request.mockImplementation(async (route: string) => {
      if (route === 'app.get_info') return { isPortable: false, version: '2.0.0' }
      return undefined
    })
  })

  it('omits feedback and other removed actions', async () => {
    const user = userEvent.setup()
    await renderAboutSettings()

    const repositoryButtons = screen.getAllByRole('button', { name: 'settings.about.repository' })
    expect(repositoryButtons).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Cherry Studio' })).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()

    await user.click(repositoryButtons[0])
    expect(mocks.request).toHaveBeenCalledWith('system.shell.open_website', REPOSITORY_URL)

    await user.click(repositoryButtons[1])
    expect(mocks.request).toHaveBeenCalledWith('system.shell.open_website', REPOSITORY_URL)

    expect(screen.queryByText('settings.general.auto_check_update.title')).not.toBeInTheDocument()
    expect(screen.queryByText('settings.general.test_plan.title')).not.toBeInTheDocument()
    expect(screen.queryByText('settings.about.releases.title')).not.toBeInTheDocument()
    expect(screen.queryByText('settings.about.website.title')).not.toBeInTheDocument()
    expect(screen.queryByText('settings.about.enterprise.title')).not.toBeInTheDocument()
    expect(screen.queryByText('settings.about.contact.title')).not.toBeInTheDocument()
    expect(screen.queryByText('settings.about.careers.title')).not.toBeInTheDocument()
    expect(screen.queryByText('settings.about.diagnostics.entry.title')).not.toBeInTheDocument()
    expect(screen.queryByText('settings.about.debug.title')).not.toBeInTheDocument()
    expect(screen.queryByText('settings.about.feedback.title')).not.toBeInTheDocument()
  })
})

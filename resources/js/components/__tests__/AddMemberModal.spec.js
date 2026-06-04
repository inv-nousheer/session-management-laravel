import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AddMemberModal from '../AddMemberModal.vue'

const users = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.test' },
  { id: 2, name: 'Grace Hopper', email: 'grace@example.test' },
]

const mountModal = (props = {}) => mount(AddMemberModal, {
  props: {
    selectedUsers: [],
    filteredUsers: users,
    searchTerm: '',
    showUserSuggestions: false,
    submitting: false,
    ...props,
  },
})

const findRemoveMemberButton = (wrapper) => wrapper.findAll('button')
  .filter((button) => button.text() === '')
  .at(-1)

describe('AddMemberModal.vue', () => {
  it('renders selected members, matching suggestions, and helper text', () => {
    const wrapper = mountModal({
      selectedUsers: [users[0]],
      searchTerm: 'gra',
      showUserSuggestions: true,
    })

    expect(wrapper.attributes('role')).toBe('dialog')
    expect(wrapper.attributes('aria-modal')).toBe('true')
    expect(wrapper.text()).toContain('Add Member to Session')
    expect(wrapper.text()).toContain('Search Members')
    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.text()).toContain('Grace Hopper')
    expect(wrapper.text()).toContain('grace@example.test')
    expect(wrapper.text()).toContain('Tip: paste multiple names/emails separated by comma or new line.')
  })

  it('shows an empty suggestion message when no filtered users match', () => {
    const wrapper = mountModal({
      filteredUsers: [],
      searchTerm: 'missing',
      showUserSuggestions: true,
    })

    expect(wrapper.text()).toContain('No users match your search.')
  })

  it('emits close, submit, and selected-user removal actions', async () => {
    const wrapper = mountModal({
      selectedUsers: [users[0]],
    })

    await wrapper.find('.bg-black\\/50').trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === 'Cancel').trigger('click')
    await wrapper.findAll('button').find((button) => button.text() === 'Add Members').trigger('click')
    await findRemoveMemberButton(wrapper).trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(2)
    expect(wrapper.emitted('submit')).toHaveLength(1)
    expect(wrapper.emitted('remove-draft-user')).toEqual([[1]])
  })

  it('emits search field interactions for parent-managed state', async () => {
    const wrapper = mountModal()
    const input = wrapper.find('input')

    await input.setValue('ada')
    await input.trigger('focus')
    await input.trigger('blur')
    await input.trigger('keydown', { key: 'Enter' })
    await input.trigger('paste')

    expect(wrapper.emitted('update:searchTerm')).toEqual([['ada']])
    expect(wrapper.emitted('update:showUserSuggestions')).toEqual([[true]])
    expect(wrapper.emitted('search-blur')).toHaveLength(1)
    expect(wrapper.emitted('search-keydown')).toHaveLength(1)
    expect(wrapper.emitted('search-keydown')[0][0]).toBeInstanceOf(KeyboardEvent)
    expect(wrapper.emitted('search-paste')).toHaveLength(1)
  })

  it('selects a suggested user and clears the search text', async () => {
    const wrapper = mountModal({
      searchTerm: 'ada',
      showUserSuggestions: true,
    })

    await wrapper.findAll('button').find((button) => button.text().includes('Ada Lovelace')).trigger('click')

    expect(wrapper.emitted('add-selected-user')).toEqual([[users[0]]])
    expect(wrapper.emitted('update:searchTerm')).toEqual([['']])
    expect(wrapper.emitted('update:showUserSuggestions')).toEqual([[true]])
  })

  it('disables mutating controls while submitting or when no users are selected', () => {
    const emptyWrapper = mountModal()
    const emptySubmit = emptyWrapper.findAll('button')
      .find((button) => button.text() === 'Add Members')

    expect(emptySubmit.attributes('disabled')).toBeDefined()

    const submittingWrapper = mountModal({
      selectedUsers: [users[0]],
      submitting: true,
    })

    expect(submittingWrapper.find('input').attributes('disabled')).toBeDefined()
    expect(findRemoveMemberButton(submittingWrapper).attributes('disabled')).toBeDefined()
    expect(submittingWrapper.findAll('button').find((button) => button.text() === 'Cancel').attributes('disabled')).toBeDefined()
    expect(submittingWrapper.findAll('button').find((button) => button.text() === 'Adding...').attributes('disabled')).toBeDefined()
  })
})

import support from '../support'
import { mocks } from '../../support'
import { mockActionResponse } from '../../support/helpers'
import React, { PropTypes } from 'react'
import { Provider } from 'react-redux'
import { shallow, mount } from 'enzyme'
import { configureStore } from '../../../src/store'
import ProfileSkillsModule from '../../../src/components/ProfileSkillsModule'
import { getKeyCode, keyMap } from '../../../src/util/textInput'
import { wait } from '../../support/helpers'
import { updateUserSettings } from '../../../src/actions'

const store = configureStore().store

const currentUser = {
  id: '5',
  name: 'Honesty Counts'
}

describe('ProfileSkillsModule', () => {
  let node

  beforeEach(() => {
    node = mount(
      <ProfileSkillsModule person={currentUser} />,
      {
        context: { store, dispatch: store.dispatch },
        childContextTypes: {
          store: PropTypes.object,
          dispatch: PropTypes.func
        }
      }
    )
    mockActionResponse(updateUserSettings(), {})
  })

  const enterSkill = (value) => {
    node.find('.tag-input input').first().simulate('keyDown', {
      target: {value},
      keyCode: keyMap.ENTER
    })
  }

  it('renders without errors', () => {
    expect(node.state('firstName')).to.equal('Honesty')
    expect(node.find('.profile-skills').length).to.equal(1)
    expect(node.find('h2').first().text()).to.have.string('Welcome Honesty!')
  })

  it('is invalid without any skills set', () => {
    expect(node.state('valid')).to.be.false
  })

  it('is valid with a skill selected (created)', () => {
    enterSkill('eating-food')
    return wait(300, () => {
      expect(node.find('.tag-input ul').text()).to.have.string('eating-food')
    })
  })

  it('should save skills', () => {
    enterSkill('eating-food')
    enterSkill('hackysack')
    return wait(300, () => {
      const saveButton = node.find('button').first()
      saveButton.simulate('click')
      const storedTags = store.getState().people.current.tags
      expect(storedTags).to.deep.equal(['eating-food', 'hackysack'])
    })
  })
})

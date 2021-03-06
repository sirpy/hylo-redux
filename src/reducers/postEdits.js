import { includes, mapValues, uniq } from 'lodash'
import { pick, get } from 'lodash/fp'
import {
  CANCEL_POST_EDIT,
  CANCEL_TAG_DESCRIPTION_EDIT,
  CREATE_COMMENT,
  CREATE_POST,
  CREATE_TAG_IN_COMMUNITY,
  CREATE_TAG_IN_MODAL,
  EDIT_TAG_DESCRIPTION,
  EDIT_NEW_TAG_AND_DESCRIPTION,
  REMOVE_DOC,
  REMOVE_IMAGE,
  START_POST_EDIT,
  UPDATE_POST_EDITOR,
  UPDATE_POST,
  UPLOAD_DOC,
  UPLOAD_IMAGE
} from '../actions/constants'
import { updateMedia } from './util'
import { prepareHashtagsForEditing } from '../util/linkify'

const stateWithDoc = (state, id, doc) => {
  let obj = state[id]
  let media = uniq((obj.media || []).concat([doc]), m => m.url)
  return {
    ...state,
    [id]: {...obj, media}
  }
}

const stateWithoutDoc = (state, id, doc) => {
  let obj = state[id]
  let media = (obj.media || []).filter(m => m.url !== doc.url)
  return {
    ...state,
    [id]: {...obj, media}
  }
}

export default function (state = {}, action) {
  const { type, payload, meta, error } = action
  if (error) return state

  const { subject, id } = meta || {}
  switch (type) {
    case UPDATE_POST_EDITOR:
      if (payload.video) {
        return {
          ...state,
          [id]: updateMedia(state[id], 'video', payload.video)
        }
      }
      return {
        ...state,
        [id]: {...state[id], ...payload}
      }
    case CREATE_POST:
    case UPDATE_POST:
    case CANCEL_POST_EDIT:
      return {...state, [id]: null}
    case START_POST_EDIT:
      return {...state, [payload.id]: {
        ...payload,
        description: prepareHashtagsForEditing(payload.description)
      }}
    case UPLOAD_IMAGE:
    case REMOVE_IMAGE:
      if (subject === 'post') {
        return {
          ...state,
          [id]: updateMedia(state[id], 'image', payload)
        }
      }
      break
    case UPLOAD_DOC:
      return stateWithDoc(state, id, payload)
    case REMOVE_DOC:
      return stateWithoutDoc(state, id, payload)
  }

  return state
}

export const editingTagDescriptions = (state = false, action) => {
  const { type, error, payload } = action
  if (type === CANCEL_TAG_DESCRIPTION_EDIT) {
    return false
  } else if (includes([CREATE_POST, UPDATE_POST, CREATE_COMMENT], type) && error) {
    const response = JSON.parse(get('response.body', payload) || '{}')
    return !!response.tagsMissingDescriptions
  }

  return state
}

export const creatingTagAndDescription = (state = false, action) => {
  const { type } = action
  if (type === CANCEL_TAG_DESCRIPTION_EDIT) {
    return false
  } else if (type === CREATE_TAG_IN_MODAL) {
    return true
  }

  return state
}

export const tagDescriptionEdits = (state = {}, action) => {
  const { type, error, payload } = action
  const actionTypesToClear = [
    START_POST_EDIT,
    CANCEL_POST_EDIT,
    CREATE_COMMENT,
    CREATE_TAG_IN_MODAL,
    CREATE_TAG_IN_COMMUNITY
  ]
  if (includes([CREATE_POST, UPDATE_POST, CREATE_COMMENT], type) && error) {
    if (!payload.response) return state // e.g. network error

    const response = JSON.parse(payload.response.body)
    if (response.tagsMissingDescriptions) {
      return {
        ...mapValues(response.tagsMissingDescriptions, () => ({description: '', is_default: false})),
        ...state
      }
    }
  } else if (type === EDIT_TAG_DESCRIPTION) {
    return {...state, [payload.tag]: pick(['description', 'is_default'], payload)}
  } else if (type === EDIT_NEW_TAG_AND_DESCRIPTION) {
    return {[payload.tag]: pick(['description', 'is_default'], payload)}
  } else if (includes(actionTypesToClear, type)) {
    return {}
  }

  return state
}

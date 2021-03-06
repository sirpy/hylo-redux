import { cleanAndStringify, createCacheId } from '../util/caching'
import {
  FETCH_TAG,
  FETCH_TAG_SUMMARY,
  FETCH_TAGS,
  FOLLOW_TAG,
  REMOVE_TAG,
  CREATE_TAG_IN_COMMUNITY,
  SHOW_ALL_TAGS,
  SHOW_SHARE_TAG,
  UPDATE_COMMUNITY_TAG,
  EDIT_TAG_DESCRIPTION,
  CANCEL_TAG_DESCRIPTION_EDIT,
  EDIT_NEW_TAG_AND_DESCRIPTION,
  SET_META_TAGS
} from './constants'

export function fetchTag (tagName, communityId) {
  const path = communityId
    ? `/noo/community/${communityId}/tag/${tagName}`
    : `/noo/tag/${tagName}`
  return {
    type: FETCH_TAG,
    payload: {api: true, path},
    meta: {id: communityId || 'all', tagName}
  }
}

export function fetchTagSummary (tagName, id) {
  return {
    type: FETCH_TAG_SUMMARY,
    payload: {api: true, path: `/noo/community/${id}/tag/${tagName}/summary`},
    meta: {tagName, id}
  }
}

export function followTag (id, tagName) {
  return {
    type: FOLLOW_TAG,
    payload: {api: true, path: `/noo/community/${id}/tag/${tagName}/follow`, method: 'POST'},
    meta: {id, tagName}
  }
}

export function fetchTags (opts) {
  const { subject, id, limit, sort } = opts
  const offset = opts.offset || 0
  const cacheId = createCacheId(subject, id)

  var path
  if (subject === 'community') {
    path = `/noo/community/${id}/tags`
  }
  path += '?' + cleanAndStringify({limit, offset, sort})

  return {
    type: FETCH_TAGS,
    payload: {api: true, path},
    meta: {
      cache: {id: cacheId, bucket: 'tagsByQuery', limit, offset, array: true}
    }
  }
}

export function removeTagFromCommunity (tag, slug) {
  const { id, name } = tag
  return {
    type: REMOVE_TAG,
    payload: {api: true, path: `/noo/community/${slug}/tag/${id}`, method: 'DELETE'},
    meta: {id, name, slug}
  }
}

export function createTagInCommunity (tag, community, currentUser) {
  const { slug } = community
  return {
    type: CREATE_TAG_IN_COMMUNITY,
    payload: {api: true, params: tag, path: `/noo/community/${slug}/tag/`, method: 'POST'},
    meta: {slug, communityId: community.id, owner: currentUser, tag, optimistic: true}
  }
}

export function showAllTags (community) {
  return {
    type: SHOW_ALL_TAGS,
    payload: {community}
  }
}

export function showShareTag (tagName, slug) {
  return {type: SHOW_SHARE_TAG, payload: {tagName, slug}}
}

export function updateCommunityTag (tag, community, params) {
  const { id, name } = tag
  const { slug } = community
  return {
    type: UPDATE_COMMUNITY_TAG,
    payload: {api: true, path: `/noo/community/${slug}/tag/${id}`, params, method: 'POST'},
    meta: {
      name,
      params,
      optimistic: true,
      slug,
      communityId: community.id
    }
  }
}

export function editTagDescription (tag, description, isDefault) {
  return {type: EDIT_TAG_DESCRIPTION, payload: {tag, description, is_default: isDefault}}
}

export function cancelTagDescriptionEdit () {
  return {type: CANCEL_TAG_DESCRIPTION_EDIT}
}

export function editNewTagAndDescription (tag, description, idDefault) {
  return {type: EDIT_NEW_TAG_AND_DESCRIPTION, payload: {tag, description, is_default: idDefault}}
}

export function setMetaTags (metaTags) {
  return {
    type: SET_META_TAGS,
    payload: metaTags
  }
}

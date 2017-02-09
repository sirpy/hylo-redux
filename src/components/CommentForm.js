import React from 'react'
import { debounce, throttle } from 'lodash'
import { get } from 'lodash/fp'
import { connect } from 'react-redux'
import Avatar from './Avatar'
import CommentImageButton from './CommentImageButton'
import RichTextEditor from './RichTextEditor'
import Icon from './Icon'
import {
  showModal, createComment, updateCommentEditor, updateComment
} from '../actions'
import {
  CREATE_COMMENT, UPDATE_COMMENT
} from '../actions/constants'
import { ADDED_COMMENT, trackEvent } from '../util/analytics'
import { textLength } from '../util/text'
import { onCmdOrCtrlEnter } from '../util/textInput'
import { responseMissingTagDescriptions } from '../util/api'
import cx from 'classnames'
import { getSocket, socketUrl } from '../client/websockets'
var { array, bool, func, object, string } = React.PropTypes

// The interval between repeated typing notifications to the web socket. We send
// repeated notifications to make sure that a user gets notified even if they
// load a comment thread after someone else has already started typing.
const STARTED_TYPING_INTERVAL = 5000

// The time to wait for inactivity before announcing that typing has stopped.
const STOPPED_TYPING_WAIT_TIME = 8000

@connect((state, { postId, commentId }) => {
  const isPending = (actionType, id) =>
    !!id && get(['pending', actionType, 'id'], state) === id

  return ({
    text: postId ? state.commentEdits.new[postId] : state.commentEdits.edit[commentId],
    newComment: !commentId,
    pending: isPending(CREATE_COMMENT, postId) || isPending(UPDATE_COMMENT, commentId)
  })
}, null, null, {withRef: true})
export default class CommentForm extends React.PureComponent {
  static propTypes = {
    dispatch: func,
    postId: string,
    commentId: string,
    mentionOptions: array,
    placeholder: string,
    text: string,
    newComment: bool,
    close: func,
    pending: bool
  }

  static contextTypes = {
    isMobile: bool,
    currentUser: object
  }

  constructor (props) {
    super(props)
    this.state = {}
    if (typeof window !== 'undefined') {
      this.modifierKey = window.navigator.platform.startsWith('Mac')
      ? 'Cmd' : 'Ctrl'
    }

    this.id = Math.random().toString().slice(2, 7)
  }

  componentDidMount () {
    this.socket = getSocket()
  }

  submit = (event, newTagDescriptions) => {
    const { dispatch, postId, commentId, newComment, close, pending } = this.props
    if (event) event.preventDefault()
    if (!this.state.enabled || pending) return
    const text = this.refs.editor.getContent().replace(/<p>&nbsp;<\/p>$/m, '')
    if (!text || textLength(text) < 2) return false

    const tagDescriptions = newTagDescriptions || this.state.tagDescriptions

    const showTagEditor = () => dispatch(showModal('tag-editor', {
      creating: false,
      saveParent: this.saveWithTagDescriptions
    }))
    if (newComment) {
      dispatch(createComment({postId, text, tagDescriptions}))
      .then(action => {
        if (responseMissingTagDescriptions(action)) return showTagEditor()
        if (action.error) return
        trackEvent(ADDED_COMMENT, {post: {id: postId}})
      })
    } else {
      dispatch(updateComment(commentId, text, tagDescriptions))
      .then(action => responseMissingTagDescriptions(action) && showTagEditor())
      close()
    }

    return false
  }

  saveWithTagDescriptions = tagDescriptions => {
    this.setState({tagDescriptions})
    this.submit(null, tagDescriptions)
  }

  setText (text) {
    const { dispatch, commentId, postId, newComment } = this.props
    const storeId = newComment ? postId : commentId
    dispatch(updateCommentEditor(storeId, text, newComment))
  }

  handleKeyDown = (e) => {
    const { postId, newComment } = this.props
    const startedTyping = () => {
      if (!newComment) return
      if (this.socket) this.socket.post(socketUrl(`/noo/post/${postId}/typing`), { isTyping: true })
    }
    const startTyping = throttle(startedTyping, STARTED_TYPING_INTERVAL, {trailing: false})
    this.setEnabled(this.refs.editor.getContent())
    startTyping()
    onCmdOrCtrlEnter(e => {
      this.stoppedTyping()
      e.preventDefault()
      this.submit()
    }, e)
  }

  stoppedTyping = () => {
    const { postId, newComment } = this.props
    if (!newComment) return
    if (this.socket) this.socket.post(socketUrl(`/noo/post/${postId}/typing`), { isTyping: false })
  }

  setEnabled = (text) => {
    this.setState({enabled: text.length > 0})
  }

  stopTyping = debounce(this.stoppedTyping, STOPPED_TYPING_WAIT_TIME)

  delaySetText = debounce(text => {
    this.setEnabled(text)
    this.setText(text)
  }, 50)

  cancel = () => {
    this.setText(undefined)
  }

  render () {
    const { text, close, pending, postId } = this.props
    const { currentUser, isMobile } = this.context
    const { enabled } = this.state
    const editing = text !== undefined
    const edit = () => this.setText('')
    const placeholder = this.props.placeholder || 'Add a comment...'

    return <form onSubmit={this.submit} className='comment-form'>
      <Avatar person={currentUser} />
      {editing
        ? <div className='content'>
          <RichTextEditor ref='editor' name='comment' startFocused
            content={text}
            onChange={ev => this.delaySetText(ev.target.value)}
            onKeyUp={this.stopTyping}
            onKeyDown={this.handleKeyDown} />

          <div className='right'>
            <a className='cancel' onClick={this.cancel}>
              <Icon name='Fail' />
            </a>
          </div>

          <CommentImageButton postId={postId} />
          <input type='submit' value='Post' ref='button'
            className={cx({enabled: enabled && !pending})} />
          {close && <button onClick={close}>Cancel</button>}
          {!isMobile && this.modifierKey && <span className='meta help-text'>
            or press {this.modifierKey}-Enter
          </span>}
        </div>
      : <div className='content placeholder' onClick={edit}>
        {placeholder}
      </div>}
    </form>
  }
}

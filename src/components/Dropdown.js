import React from 'react'
import cx from 'classnames'
const { array, bool, object, string } = React.PropTypes

export default class Dropdown extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  static propTypes = {
    children: array,
    className: string,
    alignRight: bool,
    toggleChildren: object.isRequired
  }

  toggle = event => {
    this.setState({active: !this.state.active})
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  hide = event => {
    if (this.state.active) this.setState({active: false})
  }

  componentDidMount () {
    window.addEventListener('click', this.hide)
  }

  componentWillUnmount () {
    window.removeEventListener('click', this.hide)
  }

  render () {
    let { toggleChildren, className, children, alignRight } = this.props
    let { active } = this.state
    return <div className={cx('dropdown', className, {active})}>
      <a className='dropdown-toggle' onClick={this.toggle}>
        {toggleChildren}
      </a>
      <ul className={cx('dropdown-menu', {'dropdown-menu-right': alignRight})}
        onClick={() => this.toggle()}>
        {children}
      </ul>
    </div>
  }
}

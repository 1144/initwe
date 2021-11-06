import Events from '1kb/events.js'

const Event = Events.enable({})

const debug = true

if (debug) {
  const originEmit = Event.emit
  Event.emit = (...args) => {
    console.log('Event:', ...args)
    originEmit.apply(Event, args)
  }
}

export default Event

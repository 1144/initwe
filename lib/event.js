import Events from '1kb/events.js'

const Event = Events.enable({})

if (process.env.DEBUG) {
  const originEmit = Event.emit
  Event.emit = (...args) => {
    console.log('Event:', ...args)
    originEmit.apply(Event, args)
  }
}

export default Event

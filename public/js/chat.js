const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $messageTemplate = document.querySelector('#message-template').innerHTML
const $locationTemplate = document.querySelector('#location-template').innerHTML
const $sideBarTemplate = document.querySelector('#sidebar-template').innerHTML
const $sideBar = document.querySelector('#sidebar')

const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = () => {
	const $newMessage = $messages.lastElementChild
	
	const newMessageStyles = getComputedStyle($newMessage)
	const newMessageMargin = parseInt(newMessageStyles.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
	
	const visibleHeight = $newMessage.offsetHeight
	
	const containerHeight = $messages.scrollHeight
	const scrollOffset = $messages.scrollTop + visibleHeight
	
	if(containerHeight - newMessageHeight <= scrollOffset) {
		console.log('scroll')
		$messages.scrollTop = $messages.scrollHeight
	}
}

socket.on('message', (message) => {
	const html = Mustache.render($messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('HH:mm a')
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
	e.preventDefault()
	
	$messageFormButton.setAttribute('disabled', 'disabled')
	
	const message = e.target.elements.message.value
	socket.emit('sendMessage', message, error => {
		$messageFormButton.removeAttribute('disabled')
		$messageFormInput.value = ''
		$messageFormInput.focus()
		
		if (error) {
			return console.log(error)
		}
		console.log('Message delivered')
	})
})

$sendLocationButton.addEventListener('click', () => {
	$sendLocationButton.setAttribute('disabled', 'disabled')
	if (!navigator.geolocation) {
		console.log('Geolocation not supported')
	}
	
	navigator.geolocation.getCurrentPosition(({coords: {latitude, longitude}}) => {
		const location = {latitude, longitude}
		socket.emit('send-location', location, (error) => {
			$sendLocationButton.removeAttribute('disabled')
			if (error) {
				return console.log(error)
			}
			
			console.log('Location shared!')
		})
	})
})

socket.on('locationMessage', (message) => {
	console.log(message)
	
	const html = Mustache.render($locationTemplate, {
		username: message.username,
		url: message.url,
		createdAt: moment(message.createdAt).format('HH:mm a')
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

socket.emit('join', {username, room}, (error) => {
	if(error) {
		alert(error)
		location.href = '/'
	}
})

socket.on('roomData', ({room, users}) => {
	const html = Mustache.render($sideBarTemplate, {
		room,
		users
	})
	$sideBar.innerHTML = html
})

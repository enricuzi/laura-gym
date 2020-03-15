import React, {Component} from 'react'
import {Provider} from 'react-redux'
import store from './store';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import HomePage from './containers/HomePage'
import RoomPage from './containers/RoomPage'
import NotFound from './components/NotFound'
import './app.css'

export default class App extends Component {

	constructor(props) {
		super(props);
		this.state = {isAuth: false};
		this.onLoginCallback = this.onLoginCallback.bind(this);
	}

	onLoginCallback(value) {
		this.setState({isAuth: value});
		console.log("App: logged...", value);
	}

	render() {
		return (
			<Provider store={store}>
				<BrowserRouter>
					<Switch>
						<Route exact path="/" render={props =><HomePage {...props} isAuth={this.state.isAuth} onLoginCallback={this.onLoginCallback}/>}/>
						<Route path="/r/:room" component={RoomPage}/>
						<Route path="*" component={NotFound}/>
					</Switch>
				</BrowserRouter>
			</Provider>
		)
	}
}

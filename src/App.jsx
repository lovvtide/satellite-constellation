import { useState } from 'react';
import ForceGraph3D from '3d-force-graph';
import { Relay } from 'nostr-tools';

const DEV_PUBKEY = 'ff27d01cb1e56fb58580306c7ba76bb037bf211c5b573c56e4e70ca858755af0';

const COLORS = {
	primary: '#171819',
	accent: 'blue',
	highlight: 'yellow',
};

class Provider {
	constructor(element) {
		window.graph = {
			profiles: {},
			sprites: {},
			nodes: {},
			links: {},
		};

		this.graph = ForceGraph3D();
		this.graph(element);
		this.graph.d3Force('link').distance(() => {
			return 132;
		});
	}

	linkColor(link) {
		if (window.graph.hoverNode === undefined) {
			return '#434A50';
		}

		if (window.graph.hoverNode === link.target.id) {
			return COLORS.accent;
		} else if (window.graph.hoverNode === link.source.id) {
			return COLORS.highlight;
		}
	}

	onNodeHover(hovered, unhovered) {
		if (hovered) {
			window.graph.hoverNode = hovered.id;
			window.graph.focusNode = hovered.id;
		} else if (unhovered) {
			window.graph.hoverNode = '';
			window.graph.focusNode = '';
		}

		window.graph._highlightLoopUpdate = true;
	}

	onNodeClick = (node) => {
		console.log('clicked', node);
	};

	nodeLabel = ({ id }) => {
		return id;
	};

	handleSearch(value) {
		console.log('search provider called');
	}

	handleEvent({ pubkey, tags }) {
		if (!window.graph.nodes[pubkey]) {
			window.graph.nodes[pubkey] = {
				id: pubkey,
			};
		} else {
		}

		if (kind === 0) {
			window.graph.nodes[pubkey];
		} else if (kind === 3) {
		}
	}

	network(pubkey) {
		const relays = ['wss://nos.lol', 'wss://relay.damus.io'];

		for (let url of relays) {
			Relay.connect(url).then((relay) => {
				const s0 = relay.subscribe(
					[
						{
							authors: [pubkey],
							kinds: [3, 0],
						},
					],
					{
						onevent: (event) => {
							console.log('primary contact list', event);
							if (event.kind === 3) {
								handleEvent(event);
								const s1 = relay.subscribe(
									[
										{
											authors: event.tags
												.filter((tag) => {
													return tag[0] === 'p';
												})
												.map((tag) => {
													return tag[1];
												}),
											kinds: [3],
										},
									],
									{
										onevent: (event) => {
											console.log('secondary contact list', event);
											handleEvent();
										},
										oneose: () => {
											console.log('s1 eose', url);
										},
									}
								);
							} else if (event.kind === 0) {
								handleEvent(event);
							}
						},
						oneose: () => {
							console.log('s0 eose', url);
							//s0.close();
						},
					}
				);
			});
		}
	}

	draw() {
		this.graph
			.nodeOpacity(1)
			.linkOpacity(1)
			.nodeRelSize(3)
			.backgroundColor(COLORS.primary)
			.linkColor(this.linkColor)
			.nodeColor('#ffffff')
			.linkWidth(0)
			//.onLinkClick(this.onLinkClick)
			.onNodeHover(this.onNodeHover)
			.enableNodeDrag(false)
			.onNodeClick(this.onNodeClick)
			.nodeLabel(this.nodeLabel)
			//.nodeThreeObject(this.nodeThreeObject)
			.linkThreeObjectExtend(true)
			//.linkThreeObject(this.linkThreeObject)
			.linkPositionUpdate((sprite, { start, end }) => {
				if (!sprite) {
					return;
				}

				const middlePos = Object.assign(
					...['x', 'y', 'z'].map((c) => ({
						[c]: start[c] + (end[c] - start[c]) / 2, // compute middle point
					}))
				);

				// Position sprite
				Object.assign(sprite.position, middlePos);
			})
			.graphData({
				nodes: [],
				links: [],
			});
	}
}

function TopNav({ avatarImageUrl, handleSearchClicked }) {
	const avatarStyle = {
		height: 36,
		width: 36,
		borderRadius: 36,
		border: '1px solid #fff',
		marginRight: 12,
		cursor: 'pointer',
	};

	return (
		<div
			style={{
				height: 60,
				width: '100%',
				display: 'flex',
				alignItems: 'center',
				borderBottom: '1px solid #fff',
				justifyContent: 'space-between',
			}}
		>
			<div style={{ marginLeft: 12, cursor: 'pointer' }} onClick={handleSearchClicked}>
				[SEARCH]
			</div>
			{avatarImageUrl ? <img style={avatarStyle} src={avatarImageUrl} /> : <div style={avatarStyle} />}
		</div>
	);
}

function SidePanel({ open, handleClose, searchValue, handleSearchValueChange }) {
	return (
		<div
			style={{
				zIndex: 1,
				height: '100%',
				width: 400,
				position: 'absolute',
				top: 0,
				background: 'rgba(0,0,0,0.75)',
				left: open ? 0 : -400,
				borderRight: open ? '1px solid #fff' : 'none',
				transition: 'left 0.1s ease',
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<input value={searchValue} onChange={handleSearchValueChange} />
				<div onClick={handleClose}>[close]</div>
			</div>
		</div>
	);
}

function App() {
	const [pubkey, setPubkey] = useState();
	const [searchOpen, setSearchOpen] = useState();

	let provider;

	return (
		<>
			<div
				id="graph"
				style={{
					position: 'absolute',
					zIndex: -1,
					visibility: pubkey ? 'visible' : 'hidden',
					width: '100%',
				}}
			/>
			<TopNav
				handleSearchClicked={() => {
					setSearchOpen(true);
				}}
			/>
			<SidePanel
				open={searchOpen}
				handleSearchValueChange={({ target }) => {
					// TODO debounce
					provider.handleSearch(target);
				}}
				handleClose={() => {
					setSearchOpen(false);
				}}
			/>
			<div>
				<input placeholder="What is your pubkey?" />
				<button
					onClick={() => {
						setPubkey(DEV_PUBKEY);
						provider = new Provider(document.getElementById('graph'));
						provider.draw();
						provider.network(DEV_PUBKEY);
					}}
				>
					submit
				</button>
			</div>
		</>
	);
}

export default App;

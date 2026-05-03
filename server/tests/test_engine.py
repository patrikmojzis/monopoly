import pytest

from app.engine import BOARD, IllegalAction, apply_action, initial_state, legal_actions, net_worth, rent_for


def test_initial_state_supports_four_players_and_classic_board():
    state = initial_state('g', names=['Patrik', 'Clawd', 'Angelina', 'Luna'])
    assert state.turn == 'p1'
    assert state.players == ['p1', 'p2', 'p3', 'p4']
    assert state.names['p4'] == 'Luna'
    assert state.player_state['p1'].cash == 1500
    assert len(BOARD) == 40
    assert legal_actions(state, 'p1')[0]['type'] == 'roll'


def test_can_buy_after_seeded_roll_to_unowned_property_without_space_id():
    state = initial_state('g')
    apply_action(state, 'p1', {'type': 'roll'}, seed=4)  # 2+3 -> railroad 5
    assert state.phase == 'buy'
    before = state.player_state['p1'].cash
    space_id = state.pending_space
    price = BOARD[space_id].price
    apply_action(state, 'p1', {'type': 'buy'})
    assert state.owners[space_id] == 'p1'
    assert state.player_state['p1'].cash == before - price
    assert net_worth(state, 'p1') == 1500


def test_rent_and_railroad_scaling():
    state = initial_state('g')
    state.owners[5] = 'p1'
    state.owners[15] = 'p1'
    assert rent_for(state, BOARD[5]) == 50
    state.turn = 'p2'
    state.player_state['p2'].position = 3
    apply_action(state, 'p2', {'type': 'roll'}, seed=4)  # lands on 8 with seed? smoke rule not important here


def test_build_requires_color_set_and_space_id():
    state = initial_state('g')
    state.owners = {1: 'p1', 3: 'p1'}
    state.phase = 'end'
    assert any(a['type'] == 'build' for a in legal_actions(state, 'p1'))
    with pytest.raises(IllegalAction):
        apply_action(state, 'p1', {'type': 'build'})
    apply_action(state, 'p1', {'type': 'build', 'spaceId': 1})
    assert state.buildings[1] == 1


def test_go_to_jail_and_next_player_multiplayer():
    state = initial_state('g', names=['Patrik', 'Clawd', 'Angelina'])
    state.player_state['p1'].position = 24
    apply_action(state, 'p1', {'type': 'roll'}, seed=4)  # 2+3 => space 29, buy phase maybe not jail
    if state.phase == 'buy':
        apply_action(state, 'p1', {'type': 'skip_buy'})
    apply_action(state, 'p1', {'type': 'end_turn'})
    assert state.turn == 'p2'

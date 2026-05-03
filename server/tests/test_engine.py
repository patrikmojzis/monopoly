from app.engine import BOARD, apply_action, initial_state, legal_actions, net_worth


def test_initial_state_has_two_players():
    state = initial_state('g')
    assert state.turn == 'p1'
    assert state.player_state['p1'].cash == 1500
    assert len(BOARD) == 20
    assert legal_actions(state, 'p1') == [{'type': 'roll'}]


def test_can_buy_after_seeded_roll_to_unowned_property():
    state = initial_state('g')
    apply_action(state, 'p1', {'type': 'roll'}, seed=1)
    assert state.phase in {'buy', 'end'}
    if state.phase == 'buy':
        before = state.player_state['p1'].cash
        space_id = state.pending_space
        price = BOARD[space_id].price
        apply_action(state, 'p1', {'type': 'buy'})
        assert state.owners[space_id] == 'p1'
        assert state.player_state['p1'].cash == before - price
        assert net_worth(state, 'p1') == 1500

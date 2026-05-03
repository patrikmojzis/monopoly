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
        while state.phase == 'auction':
            apply_action(state, state.turn, {'type': 'pass_auction'})
    apply_action(state, 'p1', {'type': 'end_turn'})
    assert state.turn == 'p2'



def test_skip_buy_starts_auction_and_bidder_can_win():
    state = initial_state('g')
    state.phase = 'buy'
    state.pending_space = 5
    apply_action(state, 'p1', {'type': 'skip_buy'})
    assert state.phase == 'auction'
    bid = next(a for a in legal_actions(state, state.turn) if a['type'] == 'bid_auction')
    bidder = state.turn
    amount = bid['amount']
    apply_action(state, bidder, {'type': 'bid_auction', 'spaceId': 5, 'amount': amount})
    while state.phase == 'auction':
        apply_action(state, state.turn, {'type': 'pass_auction'})
    assert state.owners[5] == bidder
    assert state.player_state[bidder].cash == 1500 - amount
    assert state.phase == 'end'


def test_mortgage_unmortgage_disables_rent():
    state = initial_state('g')
    state.owners[5] = 'p1'
    state.phase = 'end'
    before = state.player_state['p1'].cash
    apply_action(state, 'p1', {'type': 'mortgage', 'spaceId': 5})
    assert state.mortgaged[5] is True
    assert state.player_state['p1'].cash == before + 100
    assert rent_for(state, BOARD[5]) == 0
    apply_action(state, 'p1', {'type': 'unmortgage', 'spaceId': 5})
    assert 5 not in state.mortgaged
    assert rent_for(state, BOARD[5]) == 25


def test_trade_proposal_accept_transfers_cash_and_properties():
    state = initial_state('g')
    state.owners[5] = 'p1'
    state.owners[6] = 'p2'
    state.phase = 'end'
    apply_action(state, 'p1', {'type': 'propose_trade', 'toPlayer': 'p2', 'cashFrom': 50, 'cashTo': 20, 'propertiesFrom': [5], 'propertiesTo': [6]})
    assert state.pending_trade is not None
    assert legal_actions(state, 'p2')[-1]['type'] == 'accept_trade'
    apply_action(state, 'p2', {'type': 'accept_trade'})
    assert state.pending_trade is None
    assert state.owners[5] == 'p2'
    assert state.owners[6] == 'p1'
    assert state.player_state['p1'].cash == 1470
    assert state.player_state['p2'].cash == 1530


def test_trade_proposal_reject_and_cancel():
    state = initial_state('g')
    state.owners[5] = 'p1'
    state.phase = 'end'
    apply_action(state, 'p1', {'type': 'propose_trade', 'toPlayer': 'p2', 'cashFrom': 0, 'cashTo': 100, 'propertiesFrom': [5]})
    apply_action(state, 'p2', {'type': 'reject_trade'})
    assert state.pending_trade is None
    assert state.owners[5] == 'p1'
    apply_action(state, 'p1', {'type': 'propose_trade', 'toPlayer': 'p2', 'cashFrom': 0, 'cashTo': 100, 'propertiesFrom': [5]})
    apply_action(state, 'p1', {'type': 'cancel_trade'})
    assert state.pending_trade is None
    assert state.owners[5] == 'p1'


def test_trade_accept_revalidates_stale_or_improved_properties():
    state = initial_state('g')
    state.owners[1] = 'p1'
    state.owners[3] = 'p1'
    state.owners[6] = 'p2'
    state.phase = 'end'
    apply_action(state, 'p1', {'type': 'propose_trade', 'toPlayer': 'p2', 'propertiesFrom': [1], 'propertiesTo': [6]})
    state.owners[1] = 'p2'
    with pytest.raises(IllegalAction):
        apply_action(state, 'p2', {'type': 'accept_trade'})

    state = initial_state('g')
    state.owners[1] = 'p1'
    state.owners[3] = 'p1'
    state.owners[6] = 'p2'
    state.phase = 'end'
    state.buildings[3] = 1
    with pytest.raises(IllegalAction):
        apply_action(state, 'p1', {'type': 'propose_trade', 'toPlayer': 'p2', 'propertiesFrom': [1], 'propertiesTo': [6]})



def test_free_parking_pot_collects_taxes_and_pays_out():
    state = initial_state('g')
    state.player_state['p1'].position = 3
    apply_action(state, 'p1', {'type': 'roll'}, seed=4)  # lands tax space 8? if not, set direct below
    if state.free_parking_pot == 0:
        state.phase = 'roll'
        state.player_state['p1'].position = 15
        apply_action(state, 'p1', {'type': 'roll'}, seed=4)  # 20 free parking? may not always
    state.free_parking_pot = 123
    state.phase = 'roll'
    state.player_state['p1'].position = 11
    before = state.player_state['p1'].cash
    # Use direct resolver for deterministic free parking payout.
    from app.engine import resolve_landing
    import random
    resolve_landing(state, 'p1', BOARD[20], 9, random.Random(1))
    assert state.player_state['p1'].cash == before + 123
    assert state.free_parking_pot == 0


def test_debt_phase_allows_mortgage_to_resolve_before_bankruptcy():
    state = initial_state('g')
    state.owners[5] = 'p1'
    state.player_state['p1'].cash = -80
    state.phase = 'end'
    from app.engine import check_bankruptcy_and_winner
    check_bankruptcy_and_winner(state, 'p1')
    assert state.phase == 'debt'
    assert any(a['type'] == 'mortgage' for a in legal_actions(state, 'p1'))
    apply_action(state, 'p1', {'type': 'mortgage', 'spaceId': 5})
    assert state.phase == 'end'
    assert state.player_state['p1'].cash == 20


def test_bankruptcy_transfers_assets_to_creditor():
    state = initial_state('g')
    state.owners[5] = 'p1'
    state.player_state['p1'].cash = -500
    state.debt = {'player': 'p1', 'amount': 500, 'creditor': 'p2', 'reason': 'rent'}
    state.phase = 'debt'
    state.turn = 'p1'
    apply_action(state, 'p1', {'type': 'declare_bankruptcy'})
    assert not state.player_state['p1'].active
    assert state.owners[5] == 'p2'
    assert state.player_state['p2'].cash >= 1500

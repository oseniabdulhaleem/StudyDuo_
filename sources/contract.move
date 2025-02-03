module Studyduo::credit_payment {
    use std::signer;
    use supra_framework::event;
    use supra_framework::coin::{Self};
    use supra_framework::supra_coin::SupraCoin;

    const TREASURY: address = @treasury;
    const REQUIRED_SUPRA: u64 = 300000000;
    const CREDITS_PER_PAYMENT: u64 = 100;

    const ERR_INVALID_AMOUNT: u64 = 1001;
    const ERR_TREASURY_NOT_INITIALIZED: u64 = 1002;
    const ERR_INSUFFICIENT_BALANCE: u64 = 1003;

    #[event]
    struct PaymentEvent has drop, store {
        sender: address,
        amount: u64,
        credits_issued: u64,
    }

    struct TreasuryStore has key {
        total_credits: u64,
        total_payments: u64,
    }

    public entry fun initialize_treasury(treasury: &signer) {
        assert!(signer::address_of(treasury) == TREASURY, 0);
        if (!coin::is_account_registered<SupraCoin>(TREASURY)) {
            coin::register<SupraCoin>(treasury);
        };
        move_to(treasury, TreasuryStore {
            total_credits: 0,
            total_payments: 0,
        });
    }

    public entry fun buy_credits(payer: &signer) acquires TreasuryStore {
        let sender_addr = signer::address_of(payer);
        let balance = coin::balance<SupraCoin>(sender_addr);
        
        // assert!(exists<TreasuryStore>(TREASURY), ERR_TREASURY_NOT_INITIALIZED);
        // assert!(coin::balance<SupraCoin>(sender_addr) >= REQUIRED_SUPRA, ERR_INSUFFICIENT_BALANCE);
        // Check amount before attempting withdrawal
        assert!(balance >= REQUIRED_SUPRA, ERR_INSUFFICIENT_BALANCE);
        assert!(exists<TreasuryStore>(TREASURY), ERR_TREASURY_NOT_INITIALIZED);

        let payment = coin::withdraw<SupraCoin>(payer, REQUIRED_SUPRA);
        coin::deposit(TREASURY, payment);

        let treasury = borrow_global_mut<TreasuryStore>(TREASURY);
        treasury.total_credits = treasury.total_credits + CREDITS_PER_PAYMENT;
        treasury.total_payments = treasury.total_payments + 1;

        event::emit(PaymentEvent {
            sender: sender_addr,
            amount: REQUIRED_SUPRA,
            credits_issued: CREDITS_PER_PAYMENT
        });
    }

    #[view]
    public fun get_total_credits(): u64 acquires TreasuryStore {
        borrow_global<TreasuryStore>(TREASURY).total_credits
    }

    #[view]
    public fun get_total_payments(): u64 acquires TreasuryStore {
        borrow_global<TreasuryStore>(TREASURY).total_payments
    }
}
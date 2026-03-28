# 💳 Stripe Test Credit Cards - Quick Reference

## ✅ SUCCESSFUL CARDS

### Visa (Most Common)
```
Card: 4242 4242 4242 4242
CVC: 123
Expiry: 12/25
```
**Use this for most testing**

### Visa Debit
```
Card: 4000 0566 5566 5556
CVC: 123
Expiry: 12/25
```

### Mastercard
```
Card: 5555 5555 5555 4444
CVC: 123
Expiry: 12/25
```

### American Express
```
Card: 3782 822463 10005
CVC: 1234
Expiry: 12/25
```

### Discover
```
Card: 6011 1111 1111 1117
CVC: 123
Expiry: 12/25
```

---

## ❌ FAILURE CARDS

### Generic Decline
```
Card: 4000 0000 0000 0002
```
Tests basic decline handling

### Insufficient Funds
```
Card: 4000 0000 0000 9995
```
Tests insufficient_funds error

### Expired Card
```
Card: 4000 0000 0000 0069
```
Tests expired_card error

### Incorrect CVC
```
Card: 4000 0000 0000 0127
```
Tests incorrect_cvc error

### Processing Error
```
Card: 4000 0000 0000 0119
```
Tests processing_error handling

---

## 🔐 3D SECURE CARDS

### Requires Authentication
```
Card: 4000 0025 0000 3155
```
Will trigger 3D Secure modal

---

## 📋 QUICK TEST CHECKLIST

### Solo Plan ($19/mo)
- [ ] Card: `4242 4242 4242 4242`
- [ ] Should create 14-day trial
- [ ] Should send welcome SMS
- [ ] Should NOT provision voice

### Solo + Voice Plan ($39/mo)
- [ ] Card: `4242 4242 4242 4242`
- [ ] Should create 14-day trial
- [ ] Should provision VAPI assistant
- [ ] voice_enabled = true
- [ ] voice_minutes_quota = 100

### Card Decline Test
- [ ] Card: `4000 0000 0000 0002`
- [ ] Should show error message
- [ ] Should NOT create user
- [ ] Should NOT charge

### Payment Method Update
- [ ] Card: `5555 5555 5555 4444` (Mastercard)
- [ ] Should save to Stripe
- [ ] Should show in dashboard

---

## 🎯 COMMON TEST SCENARIOS

### Test Full Signup Flow
```
1. Go to https://pokkit.ai/signup
2. Select plan: Solo + Voice
3. Name: Test User
4. Phone: +15551234567
5. Email: test@example.com
6. Password: TestPass123!
7. Card: 4242 4242 4242 4242
8. CVC: 123
9. Expiry: 12/25
10. Submit
11. ✅ Should redirect to success page
12. ✅ Should receive welcome SMS
13. ✅ Should see dashboard
```

### Test Failed Payment
```
1. Follow signup flow
2. Use card: 4000 0000 0000 0002
3. ❌ Should show "Card was declined"
4. ❌ User should NOT be created
5. ✅ Can retry with valid card
```

### Test 3D Secure
```
1. Follow signup flow
2. Use card: 4000 0025 0000 3155
3. ✅ Should show 3D Secure modal
4. ✅ Click "Complete authentication"
5. ✅ Should complete signup
```

---

## ⚠️ IMPORTANT NOTES

1. **NEVER use these cards in production** (they won't work)
2. **ALWAYS use test mode Stripe keys**
3. **Any CVC works** for test cards (use 123 or 1234)
4. **Any future expiry works** (use 12/25 or later)
5. **Test cards don't send real charges**

---

## 🔗 More Info

Full Stripe testing docs: https://stripe.com/docs/testing

All test cards: https://stripe.com/docs/testing#cards

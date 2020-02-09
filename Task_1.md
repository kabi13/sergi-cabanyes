# Task 1 - Testing Monefy

## 1. Testing Charters

#### Bootcheck
```
Explore Monefy general behaviour 
With set of mobile devices (different screen sizes and OS versions)
To discover basic functionality issues at install and launch
```

#### Pro plan payments 
```
Explore Pro plan purchases
With different accounts and payment methods
To discover possible issues when trying to pay Monefy Pro
```

#### Expenses/Incomes 
```
Explore expenses/incomes functionalities and check balance consistency 
With different dates/quantities/categories
To discover inconsistencies in the balance
```

#### Settings
```
Explore settings functionalities 
With different settings for language and currency)
To discover wrong translations, problems with currencies conversion, etc.
```

#### Report filters
```
Explore menu to filter the reports 
With different combinations of accounts and time periods
To discover inconsistencies in the reports
```

#### Transfers
```
Explore transfers feature 
With different amounts and accounts
To discover inconsistencies in the balance
```

## 2. Findings

#### Bugs found
* Keyboard doesn't disappear when clicking out of it
* Expenses/incomes can be created on disabled categories
* Long texts doesn't fit buttons/dropdowns
* Problems with translations (words not translated, overlaps, cut texts..)
* Changing the currency doesn't convert the value for already created expenses/incomes
* Calendar doesn't change accordingly to the settings
* Can edit category name but not logo


## 3. Charters prioritisation

In my opinion the prioritisation should be something like this:

**1- Bootcheck** 
the basic functionality should be the first thing to check, but should be something quick. For example, take a representation of our client devices (OS versions, models, screensizes...) and test the the app can be installed and launched without problems on all of them, check that you can create an expense/income and the balance is updated properly, and then kill the app and launch it again to see if everything was kept.

**2- Pro plan payments**
Payments should be the most important thing to check once we ensure that the app is functional, so I would dedicate more time in here as this is what gives money to the company. So I would try to pay from different accounts, and with all the allowed payment methods.

**3- Expenses/Incomes and Settings**
Without data is difficult to say what's next, if we had data from real users we should prioritize accordingly (more users using it, more important to test).
As we have no data here in my opinion Expenses/Incomes and Settings would be more or less at the same level as main features in Monefy app, and also I would concentrate on testing it properly, so investing good amount of time here as well. If basic functionality is not okay churn increases drastically.

**4- Report filters and Transfers**
Would be the last thing to test from my previous list as less important features (again this is my assumption, would be better to check with users data), so I would invest less time here, probably with just a few happy path checks and more usuall errors would be enough.

## 4. Risks
In an app like this we need to make sure we keep all the data integrity when releaseing new versions, ensure we support payment methods and update the integrations if required with Google Store, Paypal, etc.

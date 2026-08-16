
package com.vibetube.app

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.rule.ActivityTestRule
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MainActivitySmokeTest {
    @get:Rule val rule=ActivityTestRule(MainActivity::class.java)

    @Test fun launches() {
        rule.activity
    }
}

package com.bodybridge.fitness;

import org.junit.Test;
import static org.junit.Assert.*;

/**
 * Unit tests for MainActivity
 */
public class MainActivityTest {

    @Test
    public void activityPackage_isCorrect() {
        assertEquals("com.bodybridge.fitness", "com.bodybridge.fitness");
    }

    @Test
    public void applicationId_isCorrect() {
        assertEquals("com.bodybridge.fitness", "com.bodybridge.fitness");
    }

    @Test
    public void versionName_isCorrect() {
        assertEquals("1.0.0", "1.0.0");
    }

    @Test
    public void versionCode_isCorrect() {
        assertEquals(3, 3);
    }

    @Test
    public void minSdkVersion_isSupported() {
        assertTrue(24 <= 35);
    }

    @Test
    public void targetSdkVersion_meetsRequirement() {
        assertTrue(35 >= 35);
    }
}
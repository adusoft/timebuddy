package com.adusoft.web;

import com.adusoft.config.PersistenceConfig;
import com.adusoft.config.WebConfig;
import com.adusoft.model.TimeEntry;
import com.adusoft.web.auth.AuthSession;
import com.adusoft.web.exception.BadRequestException;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;

import static org.mockito.Matchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {WebConfig.class, PersistenceConfig.class})
@WebAppConfiguration
public class TimeEntryControllerTest {

  @Mock
  private AuthSession authSessionMock;

  @Autowired
  @InjectMocks
  private TimeEntryController timeEntryController;

  @Before
  public void setup() {
    MockitoAnnotations.initMocks(this);
    doNothing().when(authSessionMock).checkToken(anyString());
    when(authSessionMock.getUserForToken(anyString())).thenReturn("testUsername");
  }

  @Test
  public void addProperEntry() {
    TimeEntry timeEntry = new TimeEntry();
    timeEntry.setName("Name");
    timeEntry.setCity("City");
    timeEntry.setTimezone("+10:30");

    TimeEntry savedTimeEntry = timeEntryController.create(timeEntry, "");

    Assert.assertEquals("+10:30", savedTimeEntry.getTimezone());
  }

  @Test(expected = BadRequestException.class)
  public void shouldThrowValidationException() {
    TimeEntry timeEntry = new TimeEntry();
    timeEntry.setName("Name");
    timeEntry.setCity("City");
    timeEntry.setTimezone("asdf");

    timeEntryController.create(timeEntry, "");
  }

  @Test(expected = BadRequestException.class)
  public void shouldThrowValidationExceptionWhenFieldsEmpty() {
    TimeEntry timeEntry = new TimeEntry();
    timeEntry.setName("");
    timeEntry.setCity("");
    timeEntry.setTimezone("");

    timeEntryController.create(timeEntry, "");
  }


  @Test(expected = BadRequestException.class)
  public void shouldThrowExceptionWhenDeletingNonExistingEntry() {
    timeEntryController.delete(123L, "");
  }


}

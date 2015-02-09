package com.adusoft.web;

import com.adusoft.model.TimeEntry;
import com.adusoft.repository.TimeEntryRepository;
import com.adusoft.web.auth.AuthSession;
import com.adusoft.web.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.validation.ConstraintViolationException;
import java.util.List;

import static org.springframework.http.HttpStatus.CREATED;
import static org.springframework.http.HttpStatus.OK;
import static org.springframework.web.bind.annotation.RequestMethod.*;

/**
 * TimeEntryController is the REST service for CRUD actions performed on TimeEntry.
 * Each call is expecting authToken, so user session can be validated/confirmed. In case authToken is invalid, 401 Unauthorized status is returned.
 */
@Controller
@RequestMapping(value = "/timeEntry", produces = "application/json")
@Scope("request")
public class TimeEntryController {

  @Autowired
  private TimeEntryRepository timeEntryRepository;

  @Autowired
  private AuthSession authSession;

  @RequestMapping(method = RequestMethod.GET)
  @ResponseBody
  public List<TimeEntry> list(@RequestHeader(value = "authToken", required = false) String authToken) {
    authSession.checkToken(authToken);
    return timeEntryRepository.findByUsername(authSession.getUserForToken(authToken));
  }

  @RequestMapping(value = "{name}", method = GET)
  @ResponseBody
  public List<TimeEntry> get(@PathVariable String name, @RequestHeader(value = "authToken", required = false) String authToken) {
    authSession.checkToken(authToken);
    return timeEntryRepository.findByUsernameAndNameLike(authSession.getUserForToken(authToken), "%" + name + "%");
  }

  @RequestMapping(method = POST, consumes = "application/json")
  @ResponseStatus(CREATED)
  @ResponseBody
  public TimeEntry create(@RequestBody TimeEntry timeEntry, @RequestHeader(value = "authToken", required = false) String authToken) {
    authSession.checkToken(authToken);
    timeEntry.setUsername(authSession.getUserForToken(authToken));
    try {
      return timeEntryRepository.save(timeEntry);
    } catch (ConstraintViolationException e) {
      throw new BadRequestException("Data validation error");
    }
  }

  @RequestMapping(value = "{id}", method = PUT, consumes = "application/json")
  @ResponseStatus(OK)
  @ResponseBody
  public TimeEntry update(@RequestBody TimeEntry timeEntry, @PathVariable Long id, @RequestHeader(value = "authToken", required = false) String authToken) {
    authSession.checkToken(authToken);
    timeEntry.setUsername(authSession.getUserForToken(authToken));
    timeEntry.setId(id);
    try {
      return timeEntryRepository.save(timeEntry);
    } catch (ConstraintViolationException e) {
      throw new BadRequestException("Data validation error");
    }
  }

  @RequestMapping(value = "{id}", method = DELETE)
  @ResponseStatus(OK)
  public void delete(@PathVariable Long id, @RequestHeader(value = "authToken", required = false) String authToken) {
    authSession.checkToken(authToken);
    try {
      timeEntryRepository.delete(id);
    } catch (EmptyResultDataAccessException e) {
      throw new BadRequestException("Entry doesn't exists");
    }
  }

}

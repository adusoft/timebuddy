package com.adusoft.web;

import com.adusoft.config.PersistenceConfig;
import com.adusoft.config.WebConfig;
import com.adusoft.model.TimeEntry;
import com.adusoft.repository.UserRepository;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;

import java.util.List;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {WebConfig.class, PersistenceConfig.class})
@WebAppConfiguration
public class UserControllerTest {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private UserController userController;

  @Test
  public void registerUser() {
  }

}

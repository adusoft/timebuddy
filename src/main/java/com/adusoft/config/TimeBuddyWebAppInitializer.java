package com.adusoft.config;

import org.springframework.core.annotation.Order;
import org.springframework.web.WebApplicationInitializer;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.DispatcherServlet;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletRegistration;

@Order(1)
public class TimeBuddyWebAppInitializer implements WebApplicationInitializer {

  @Override
  public void onStartup(ServletContext servletContext) throws ServletException {
    AnnotationConfigWebApplicationContext dispatcherContext = new AnnotationConfigWebApplicationContext();
    dispatcherContext.scan("com.adusoft.config");

    ServletRegistration.Dynamic dispatcherServlet = servletContext.addServlet("dispatcher", new DispatcherServlet(dispatcherContext));
    dispatcherServlet.setLoadOnStartup(1);
    dispatcherServlet.addMapping("/");
  }
}

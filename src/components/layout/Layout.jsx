import React from 'react';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="page-container-mica font-inter">
      <div className="layout-container flex h-full min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

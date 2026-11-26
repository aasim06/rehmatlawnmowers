import { Suspense } from 'react';
import Loader from './Loader';

// ==============================|| LOADABLE - LAZY LOADING WRAPPER ||============================== //

const Loadable = (Component) => {
  const LoadableComponent = (props) => (
    <Suspense fallback={<Loader />}>
      <Component {...props} />
    </Suspense>
  );
  LoadableComponent.displayName = `Loadable(${Component.displayName || Component.name || 'Component'})`;
  return LoadableComponent;
};

export default Loadable;

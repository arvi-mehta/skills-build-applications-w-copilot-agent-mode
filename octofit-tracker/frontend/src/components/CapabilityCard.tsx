import { useEffect, useState, type ReactNode } from 'react';

type Resource<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: T };

type Props<T> = {
  title: string;
  description: string;
  path: string;
  load: (path: string) => Promise<T>;
  emptyText?: string;
  isEmpty?: (data: T) => boolean;
  render?: (data: T) => ReactNode;
};

export function CapabilityCard<T>({
  title,
  description,
  path,
  load,
  emptyText = 'No records yet.',
  isEmpty,
  render,
}: Props<T>) {
  const [resource, setResource] = useState<Resource<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setResource({ status: 'loading' });
    void load(path)
      .then((data) => {
        if (active) setResource({ status: 'success', data });
      })
      .catch(() => {
        if (active) setResource({ status: 'error' });
      });

    return () => {
      active = false;
    };
  }, [load, path]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {resource.status === 'loading' ? (
          <p role="status">Loading {title.toLowerCase()}...</p>
        ) : resource.status === 'error' ? (
          <p role="alert">Unable to load {title.toLowerCase()}.</p>
        ) : isEmpty?.(resource.data) ? (
          <p role="status">{emptyText}</p>
        ) : (
          render?.(resource.data)
        )}
      </div>
    </section>
  );
}

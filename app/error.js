import React from 'react'

export default function Error({ statusCode }) {
  return (
    <div className="error-message">
      <style jsx>{`
        .error-message {
          color: red;
          font-size: 20px;
          text-align: center;
          margin-top: 20px;
        }
      `}</style>
      <p>
        {statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </p>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

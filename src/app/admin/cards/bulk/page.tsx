import BulkForm from './bulk-form'

export default function BulkPage() {
  return (
    <main>
      <h1>Bulk upload</h1>
      <p className="muted">Create many client logins and cards from one file.</p>

      <section className="adm-box">
        <h2>How to prepare the file</h2>
        <ol>
          <li>In Excel, make one row per client. The first row holds the column names.</li>
          <li>Required columns: <code>username</code>, <code>slug</code>, <code>name</code>. Optional: <code>company</code>, <code>designation</code>, <code>phone</code>, <code>email</code>, <code>theme</code>.</li>
          <li>Save it as <strong>CSV (Comma delimited)</strong>, then upload it here (up to 200 clients at a time; they are created in small groups, so keep the page open until it finishes).</li>
        </ol>
        <pre className="adm-pre">{`username,slug,name,company,phone
rahul-sharma,rahul-sharma,Rahul Sharma,Sharma Interiors,+91 98765 43210
priya-patel,priya-patel,Priya Patel,Patel Dental Clinic,+91 98123 45678`}</pre>
        <p><a href="/bulk-template.csv" download>Download a template file</a></p>
      </section>

      <BulkForm />
    </main>
  )
}

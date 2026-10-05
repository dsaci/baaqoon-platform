const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/DistributionAdminPage.tsx';
let code = fs.readFileSync(path, 'utf8');

const errorBoundaryCode = `
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: 'white' }}>
          <h1>Something went wrong in DistributionAdminPage.</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
`;

if (code.includes('export default function DistributionAdminPage() {')) {
    code = code.replace('export default function DistributionAdminPage() {', errorBoundaryCode + '\nfunction DistributionAdminPageInner() {');
    code = code + `\nexport default function DistributionAdminPage() { return <ErrorBoundary><DistributionAdminPageInner /></ErrorBoundary>; }`;
    fs.writeFileSync(path, code);
    console.log('Error Boundary added');
} else {
    console.log('Could not find export default');
}

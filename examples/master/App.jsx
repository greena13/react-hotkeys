import {FocusTrap} from 'lib';

const App = React.createClass({

  render() {
    return (
      <FocusTrap>
        <div className="viewport">

        </div>
        <div className="tools">
          <FocusTrap>
            <input type="text" />
          </FocusTrap>
        </div>
      </FocusTrap>
    )
  }

});
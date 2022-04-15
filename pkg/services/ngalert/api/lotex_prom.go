package api

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	apimodels "github.com/grafana/grafana/pkg/services/ngalert/api/tooling/definitions"
	"github.com/grafana/grafana/pkg/web"
)

type promEndpoints struct {
	rules, alerts string
}

var dsTypeToLotexRoutes = map[string]promEndpoints{
	"prometheus": {
		rules:  "/api/v1/rules",
		alerts: "/api/v1/alerts",
	},
	"loki": {
		rules:  "/prometheus/api/v1/rules",
		alerts: "/prometheus/api/v1/alerts",
	},
}

type LotexProm struct {
	log log.Logger
	*AlertingProxy
}

func NewLotexProm(proxy *AlertingProxy, log log.Logger) *LotexProm {
	return &LotexProm{
		log:           log,
		AlertingProxy: proxy,
	}
}

func (p *LotexProm) RouteGetAlertStatuses(ctx *models.ReqContext) response.Response {
	endpoints, err := p.getEndpoints(ctx)
	if err != nil {
		return ErrResp(http.StatusInternalServerError, err, "")
	}

	return p.withReq(
		ctx,
		http.MethodGet,
		withPath(
			*ctx.Req.URL,
			endpoints.alerts,
		),
		nil,
		jsonExtractor(&apimodels.AlertResponse{}),
		nil,
	)
}

func (p *LotexProm) RouteGetRuleStatuses(ctx *models.ReqContext) response.Response {
	endpoints, err := p.getEndpoints(ctx)
	if err != nil {
		return ErrResp(http.StatusInternalServerError, err, "")
	}

	return p.withReq(
		ctx,
		http.MethodGet,
		withPath(
			*ctx.Req.URL,
			endpoints.rules,
		),
		nil,
		jsonExtractor(&apimodels.RuleResponse{}),
		nil,
	)
}

func (p *LotexProm) getEndpoints(ctx *models.ReqContext) (*promEndpoints, error) {
	ds, err := p.getDatasourceFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	if ds.Url == "" {
		return nil, fmt.Errorf("URL for this data source is empty")
	}

	routes, ok := dsTypeToLotexRoutes[ds.Type]
	if !ok {
		return nil, fmt.Errorf("unexpected datasource type. expecting loki or prometheus")
	}
	return &routes, nil
}

func (p *LotexProm) getDatasourceFromCtx(ctx *models.ReqContext) (*models.DataSource, error) {
	datasourceID := web.Params(ctx.Req)[":DatasourceID"]
	if datasourceID != "" {
		recipient, err := strconv.ParseInt(datasourceID, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("DatasourceID is invalid")
		}

		return p.DataProxy.DataSourceCache.GetDatasource(ctx.Req.Context(), recipient, ctx.SignedInUser, ctx.SkipCache)
	} else {
		datasourceUID := web.Params(ctx.Req)[":DatasourceUID"]
		if datasourceUID == "" {
			return nil, fmt.Errorf("DatasourceUID is invalid")
		}
		return p.DataProxy.DataSourceCache.GetDatasourceByUID(ctx.Req.Context(), datasourceUID, ctx.SignedInUser, ctx.SkipCache)
	}
}
